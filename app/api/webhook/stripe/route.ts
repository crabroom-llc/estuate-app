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
import Stripe from "stripe";


export async function POST(request: NextRequest) {
    try {
        const stripeSecretKey = process.env.STRIPE_CLIENT_SECRET;
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!stripeSecretKey) {
            console.error("❌ STRIPE_SECRET_KEY is missing");
            return NextResponse.json({ error: "Server misconfiguration: STRIPE_SECRET_KEY is missing" }, { status: 500 });
        }

        if (!webhookSecret) {
            console.error("❌ STRIPE_WEBHOOK_SECRET is missing");
            return NextResponse.json({ error: "Server misconfiguration: STRIPE_WEBHOOK_SECRET is missing" }, { status: 500 });
        }

        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
        });

        const sig = request.headers.get("stripe-signature");
        if (!sig) {
            return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
        }

        // Read raw request body as buffer
        const requestBody = await request.arrayBuffer();
        const buffer = Buffer.from(requestBody);

        let event;
        try {
            event = stripe.webhooks.constructEvent(buffer, sig, webhookSecret);
        } catch (err: any) {
            console.error("❌ Webhook signature verification failed:", err.message);
            return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
        }

        console.log("🔔 Stripe Webhook Event Received:", JSON.stringify(event, null, 2));

        // ✅ Use `event.data.object` instead of parsing request.json()
        const eventData = event.data.object;

        // 🔹 Validate if the request body is not empty
        if (!eventData) {
            console.error("❌ Empty event data received");
            return NextResponse.json(
                { message: "Empty event data" },
                { status: 400 }
            );
        }

        // ✅ Respond to Stripe immediately to prevent retries
        const response = NextResponse.json(
            { message: "Webhook received, processing in background" },
            { status: 200 }
        );
        
        if (event.request?.idempotency_key?.startsWith("stripe-node-retry")) {
            console.log("🚫 Skipping Stripe update because it was triggered by HubSpot");
            return response;
        }

        // 🚀 Process the webhook asynchronously
        processWebhookEvents(event);

        return response;
    } catch (error: any) {
        console.error("❌ Error processing Stripe webhook:", error.message);
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