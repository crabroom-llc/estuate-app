import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/utils/mysql";
import { contactUpdated } from "@/components/hubspotWebhookActivities/contact/contactUpdated";
import { contactDeleted } from "@/components/hubspotWebhookActivities/contact/contactDeleted";
import { productCreated } from "@/components/hubspotWebhookActivities/product/productCreated";
import { productUpdated } from "@/components/hubspotWebhookActivities/product/productUpdated";
import { companyCreated } from "@/components/hubspotWebhookActivities/company/companyCreated";
import { companyUpdated } from "@/components/hubspotWebhookActivities/company/companyUpdated";
import { companyDeleted } from "@/components/hubspotWebhookActivities/company/companyDeleted";
import { productDeleted } from "@/components/hubspotWebhookActivities/product/productDeleted";
import { invoicePaid } from "@/components/stripeWebhookActivities/invoice/invoicePaid";
import { customerUpdate } from "@/components/stripeWebhookActivities/customer/customerUpdate";
import { companyUpdate } from "@/components/stripeWebhookActivities/company/companyUpdate";
import { productUpdate } from "@/components/stripeWebhookActivities/product/productUpdated";
export async function POST(request: NextRequest) {
    try {
        const parsedBody = await request.json();

        // 🔹 Validate if the request body is not empty
        if (!parsedBody) {
            console.error("❌ Empty request body received");
            return NextResponse.json(
                { message: "Empty request body" },
                { status: 400 }
            );
        }

        console.log(
            "🔔 Stripe Webhook Event Received:",
            JSON.stringify(parsedBody, null, 2)
        );

        // ✅ Respond immediately to Stripe to prevent retries
        const response = NextResponse.json(
            { message: "Webhook received, processing in background" },
            { status: 200 }
        );

        // 🚫 Skip Stripe update if it was triggered by HubSpot
        if (parsedBody.request.idempotency_key.startsWith("stripe-node-retry")) {
            console.log("🚫 Skipping Stripe update because it was triggered by Hubspot");
            return response;
        }

        // 🚀 Process the webhook asynchronously
        processWebhookEvents(parsedBody);

        return response;
    } catch (error: any) {
        console.error("❌ Error processing HubSpot webhook:", error.message);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// 🔄 Background processing function
async function processWebhookEvents(event: any) {
    try {
        // ✅ Check if webhook events exist
        if (!event || event.length === 0) {
            console.warn("⚠️ No webhook events to process.");
            return;
        }
        // ✅ Extract Portal ID from first event
        const accountId = event.account;
        if (!accountId) {
            console.error("❌ Missing portal ID in request.");
            return;
        }

        // ✅ Fetch Portal ID from DB to validate
        const [rows]: any[] = await pool.query(
            `SELECT stripe_acc FROM user_oauth WHERE stripe_acc = ?`,
            [accountId]
        );

        if (!rows || rows.length === 0) {
            console.error(
                "❌ Unauthorized Stripe Account. Account ID not found:",
                accountId
            );
            return;
        }

        // ✅ Process Each Webhook Event
        try {

            const subscriptionType = event.type;
            const objectId = event.data.object.id;

            if (!objectId) {
                console.warn(`⚠️ Skipping event due to missing objectId:`, event);
                return;
            }

            console.log(`🔹 Event Type: ${subscriptionType}`);
            console.log(`🔹 Object ID: ${objectId}`);

            switch (subscriptionType) {
                case "invoice.paid":
                    console.log("✅ Invoice Paid Event Detected!");
                    await invoicePaid(accountId, objectId);
                    break;

                case "customer.updated":
                    console.log("✏️ Update Event Detected!");
                    if (event.data.object.metadata.deleted == "false") {
                        if (event.data.object.metadata.hubspot_contact_id !== undefined) {
                            await customerUpdate(event.data, accountId, objectId);
                        } else if (event.data.object.metadata.hubspot_company_id !== undefined) {
                            await companyUpdate(event.data, accountId, objectId);
                        }
                    }
                    break;

                case "product.updated":
                    console.log("✏️ Product Update Event Detected!");
                    if (event.data.object.metadata.deleted == "false") {
                        await productUpdate(event.data, accountId, objectId);
                    }
                    break;

                case "product.creation":
                    console.log("✅ Product Created Event Detected!");
                    // await productCreated(accountId, objectId);
                    break;
                case "product.propertyChange":
                    console.log("✅ Product Created Event Detected!");
                    // await productUpdated(accountId, objectId, propertyName, propertyValue);
                    break;

                case "product.deletion":
                    console.log("🗑️ Product Deleted Event Detected!");
                    // await productDeleted(accountId, objectId);
                    break;

                case "company.creation":
                    console.log("✅ Company Created Event Detected!");
                    // await companyCreated(accountId, objectId);
                    break;

                case "company.deletion":
                    console.log("🗑️ Company Deleted Event Detected!");
                    // await companyDeleted(accountId, objectId);
                    break;

                case "company.propertyChange":
                    console.log("✏️ Company Property Changed Event Detected!");
                    // await companyUpdated(
                    //   accountId,
                    //   objectId,
                    //   propertyName,
                    //   propertyValue
                    // );
                    break;

                default:
                    console.warn("⚠️ Unknown Event Type:", subscriptionType);

                    break;
            }
        } catch (eventError) {
            console.error("❌ Error processing event:", event, eventError);
        }

        console.log("✅ Portal ID verified successfully:", accountId);
    } catch (error: any) {
        console.error("❌ Error in processing webhook events:", error.message);
    }
}