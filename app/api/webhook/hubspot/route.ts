import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/utils/mysql";
import { contactCreated } from "@/components/hubspotWebhookActivities/contact/contactCreated";
import { contactUpdated } from "@/components/hubspotWebhookActivities/contact/contactUpdated";
import { contactDeleted } from "@/components/hubspotWebhookActivities/contact/contactDeleted";
import { productCreated } from "@/components/hubspotWebhookActivities/product/productCreated";
import { productUpdated } from "@/components/hubspotWebhookActivities/product/productUpdated";
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    // 🔹 Validate if the request body is not empty
    if (!rawBody) {
      console.error("❌ Empty request body received");
      return NextResponse.json(
        { message: "Empty request body" },
        { status: 400 }
      );
    }

    let parsedBody;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch (error) {
      console.error("❌ Invalid JSON format:", error);
      return NextResponse.json(
        { message: "Invalid JSON format" },
        { status: 400 }
      );
    }

    console.log(
      "🔔 HubSpot Webhook Event Received:",
      JSON.stringify(parsedBody, null, 2)
    );

    // ✅ Respond immediately to HubSpot to prevent retries
    const response = NextResponse.json(
      { message: "Webhook received, processing in background" },
      { status: 200 }
    );

    // 🚀 Process the webhook asynchronously
    processWebhookEvents(parsedBody);

    return response;
  } catch (error: any) {
    console.error("❌ Error processing HubSpot webhook:", error.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// 🔄 Background processing function
async function processWebhookEvents(parsedBody: any) {
  try {
    // ✅ Check if webhook events exist
    if (!parsedBody || parsedBody.length === 0) {
      console.warn("⚠️ No webhook events to process.");
      return;
    }

    // ✅ Sort webhook events: "contact.creation" comes first
    parsedBody.sort((a, b) => {
      if (a.subscriptionType === "contact.creation") return -1; // Move up
      if (b.subscriptionType === "contact.creation") return 1; // Move down
      return 0; // Keep order otherwise
    });

    // ✅ Extract Portal ID from first event
    const portalId = parsedBody[0]?.portalId;
    if (!portalId) {
      console.error("❌ Missing portal ID in request.");
      return;
    }

    // ✅ Fetch Portal ID from DB to validate
    const [rows]: any[] = await pool.query(
      `SELECT hubspot_acc FROM user_oauth WHERE hubspot_acc = ?`,
      [portalId]
    );

    if (!rows || rows.length === 0) {
      console.error(
        "❌ Unauthorized HubSpot Account. Portal ID not found:",
        portalId
      );
      return;
    }

    // ✅ Process Each Webhook Event
    for (const event of parsedBody) {
      try {
        const {
          subscriptionType,
          objectId,
          propertyName = null,
          propertyValue = null,
        } = event ?? {};

        if (!objectId) {
          console.warn(`⚠️ Skipping event due to missing objectId:`, event);
          continue; // Skip event if objectId is missing
        }

        console.log(`🔹 Event Type: ${subscriptionType}`);
        console.log(`🔹 Object ID: ${objectId}`);

        switch (subscriptionType) {
          case "contact.creation":
            console.log("✅ Contact Created Event Detected!");
            await contactCreated(portalId, objectId);
            break;

          case "contact.deletion":
            console.log("🗑️ Contact Deleted Event Detected!");
            // Handle deletion logic here
            // await contactDeleted(portalId, objectId);
            break;

          case "contact.propertyChange":
            console.log("✏️ Contact Property Changed Event Detected!");
            await contactUpdated(
              portalId,
              objectId,
              propertyName,
              propertyValue
            );
            break;
            
            case "product.creation":
            console.log("✅ Product Created Event Detected!");
            await productCreated(portalId, objectId);
            break;
            case "product.propertyChange":
            console.log("✅ Product Created Event Detected!");
            await productUpdated(portalId, objectId, propertyName, propertyValue);
            break;

          default:
            console.warn("⚠️ Unknown Event Type:", subscriptionType);
            
            break;
        }
      } catch (eventError) {
        console.error("❌ Error processing event:", event, eventError);
      }
    }

    console.log("✅ Portal ID verified successfully:", portalId);
  } catch (error: any) {
    console.error("❌ Error in processing webhook events:", error.message);
  }
}
