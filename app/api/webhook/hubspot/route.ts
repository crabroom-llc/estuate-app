import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/utils/mysql";
import { contactCreated } from "@/components/hubspotWebhookActivities/contact/contactCreated";
import { contactUpdated } from "@/components/hubspotWebhookActivities/contact/contactUpdated";
import { contactDeleted } from "@/components/hubspotWebhookActivities/contact/contactDeleted";
import { productCreated } from "@/components/hubspotWebhookActivities/product/productCreated";
import { productUpdated } from "@/components/hubspotWebhookActivities/product/productUpdated";
import { dealCreated } from "@/components/hubspotWebhookActivities/deal/dealCreated";
import { dealUpdated } from "@/components/hubspotWebhookActivities/deal/dealUpdated";
import { companyCreated } from "@/components/hubspotWebhookActivities/company/companyCreated";
import { companyUpdated } from "@/components/hubspotWebhookActivities/company/companyUpdated";
import { companyDeleted } from "@/components/hubspotWebhookActivities/company/companyDeleted";
import { productDeleted } from "@/components/hubspotWebhookActivities/product/productDeleted";


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

    // forwardWebhookEvent(rawBody);

    // 🚀 Process the webhook asynchronously
    processWebhookEvents(parsedBody);

    return response;
  } catch (error: any) {
    console.error("❌ Error processing HubSpot webhook:", error.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// 🔄 Background processing function
// async function processWebhookEvents(parsedBody: any) {
//   try {
//     // ✅ Check if webhook events exist
//     if (!parsedBody || parsedBody.length === 0) {
//       console.warn("⚠️ No webhook events to process.");
//       return;
//     }

//     // ✅ Sort webhook events: "contact.creation" comes first
//     parsedBody.sort((a, b) => {
//       if (a.subscriptionType === "contact.creation") return -1; // Move `contact.creation` up
//       if (b.subscriptionType === "contact.creation") return 1;
//       if (a.subscriptionType === "product.creation") return -1; // Move `product.creation` up (after contact)
//       if (b.subscriptionType === "product.creation") return 1;
//       return 0; // Keep order otherwise
//     });

//     // ✅ Extract Portal ID from first event
//     const portalId = parsedBody[0]?.portalId;
//     if (!portalId) {
//       console.error("❌ Missing portal ID in request.");
//       return;
//     }

//     // ✅ Fetch Portal ID from DB to validate
//     const [rows]: any[] = await pool.query(
//       `SELECT hubspot_acc FROM user_oauth WHERE hubspot_acc = ?`,
//       [portalId]
//     );

//     if (!rows || rows.length === 0) {
//       console.error(
//         "❌ Unauthorized HubSpot Account. Portal ID not found:",
//         portalId
//       );
//       return;
//     }

//     // ✅ Process Each Webhook Event
//     for (const event of parsedBody) {
//       try {
//         const {
//           subscriptionType,
//           objectId,
//           propertyName = null,
//           propertyValue = null,
//         } = event ?? {};

//         if (!objectId) {
//           console.warn(`⚠️ Skipping event due to missing objectId:`, event);
//           continue; // Skip event if objectId is missing
//         }

//         console.log(`🔹 Event Type: ${subscriptionType}`);
//         console.log(`🔹 Object ID: ${objectId}`);

//         switch (subscriptionType) {
//           case "contact.creation":
//             console.log("✅ Contact Created Event Detected!");
//             await contactCreated(portalId, objectId);
//             break;

//           case "contact.deletion":
//             console.log("🗑️ Contact Deleted Event Detected!");
//             // Handle deletion logic here
//             // await contactDeleted(portalId, objectId);
//             break;

//           case "contact.propertyChange":
//             console.log("✏️ Contact Property Changed Event Detected!");
//             await contactUpdated(
//               portalId,
//               objectId,
//               propertyName,
//               propertyValue
//             );
//             break;

//             case "product.creation":
//             console.log("✅ Product Created Event Detected!");
//             await productCreated(portalId, objectId);
//             break;

//             case "product.propertyChange":
//             console.log("✅ Product Created Event Detected!");
//             await productUpdated(portalId, objectId, propertyName, propertyValue);
//             break;
//             case "deal.creation":
//             console.log("✅ Product Created Event Detected!");
//             await dealCreated(portalId, objectId);
//             break;

//           default:
//             console.warn("⚠️ Unknown Event Type:", subscriptionType);

//             break;
//         }
//       } catch (eventError) {
//         console.error("❌ Error processing event:", event, eventError);
//       }
//     }

//     console.log("✅ Portal ID verified successfully:", portalId);
//   } catch (error: any) {
//     console.error("❌ Error in processing webhook events:", error.message);
//   }
// }

async function processWebhookEvents(parsedBody: any) {
  try {
    if (!parsedBody || parsedBody.length === 0) {
      console.warn("⚠️ No webhook events to process.");
      return;
    }

    // ✅ Sort webhook events: "contact.creation" and "product.creation" come first
    // parsedBody.sort((a, b) => {
    //   if (a.subscriptionType === "contact.creation") return -1;
    //   if (b.subscriptionType === "contact.creation") return 1;
    //   if (a.subscriptionType === "product.creation") return -1;
    //   if (b.subscriptionType === "product.creation") return 1;
    //   return 0;
    // });

    if (!Array.isArray(parsedBody)) {
      console.error("❌ Invalid webhook event format. Expected an array.");
      return;
    }

    // ✅ Sort webhook events: ".creation" events come at the first
    parsedBody.sort((a, b) => {
      const isACreation = a.subscriptionType.endsWith(".creation");
      const isBCreation = b.subscriptionType.endsWith(".creation");

      if (isACreation) return -1; // Move up
      if (isBCreation) return 1; // Move down
      return 0; // Keep order otherwise
    });

    // ✅ Extract Portal ID from first event
    const portalId = parsedBody[0]?.portalId;
    if (!portalId) {
      console.error("❌ Missing portal ID in request.");
      return;
    }

    // ✅ Validate Portal ID in DB
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


    // ✅ Check if any `.creation` event exists in the array
    const hasCreationEvent = parsedBody.some(event => event.subscriptionType.endsWith(".creation"));

    // ✅ Track processed objectIds to ignore further events
    const processedObjects = new Set<string>();


    // ✅ Process Webhook Events
    for (const event of parsedBody) {
      try {
        const { subscriptionType, objectId, propertyName = null, propertyValue = null } = event ?? {};
    
        if (!objectId) {
          console.warn(`⚠️ Skipping event due to missing objectId:`, event);
          continue;
        }
    
        console.log(`🔹 Event Type: ${subscriptionType}`);
        console.log(`🔹 Object ID: ${objectId}`);
    
        // ✅ If at least one `.creation` event exists and we already processed this objectId, skip the rest
        if (hasCreationEvent && processedObjects.has(objectId)) {
          console.log(`⏩ Skipping event because ${objectId} was already processed.`);
          continue;
        }
    
        switch (subscriptionType) {
          case "contact.creation":
            console.log("✅ Contact Created Event Detected!");
            await contactCreated(portalId, objectId);
            processedObjects.add(objectId);
            break;
    
          case "product.creation":
            console.log("✅ Product Created Event Detected!");
            await productCreated(portalId, objectId);
            processedObjects.add(objectId);
            break;
    
          case "deal.creation":
            console.log("✅ Deal Created Event Detected!");
            await dealCreated(portalId, objectId);
            processedObjects.add(objectId);
            break;
    
          case "company.creation":
            console.log("✅ Company Created Event Detected!");
            await companyCreated(portalId, objectId);
            processedObjects.add(objectId);
            break;
    
          case "contact.propertyChange":
            if (hasCreationEvent) {
              console.log(`⏩ Skipping contact.propertyChange because contact.creation exists.`);
              continue;
            }
            console.log("✏️ Contact Property Changed Event Detected!");
            await contactUpdated(portalId, objectId, propertyName, propertyValue);
            break;
    
          case "product.propertyChange":
            if (hasCreationEvent) {
              console.log(`⏩ Skipping product.propertyChange because product.creation exists.`);
              continue;
            }
            console.log("✏️ Product Property Changed Event Detected!");
            await productUpdated(portalId, objectId, propertyName, propertyValue);
            break;
    
          case "deal.propertyChange":
            if (hasCreationEvent) {
              console.log(`⏩ Skipping deal.propertyChange because deal.creation exists.`);
              continue;
            }
            console.log("✏️ Deal Property Changed Event Detected!");
            await dealUpdated(portalId, objectId, propertyName, propertyValue);
            break;
    
          case "company.propertyChange":
            if (hasCreationEvent) {
              console.log(`⏩ Skipping company.propertyChange because company.creation exists.`);
              continue;
            }
            console.log("✏️ Company Property Changed Event Detected!");
            await companyUpdated(portalId, objectId, propertyName, propertyValue);
            break;
    
          case "contact.deletion":
            if (hasCreationEvent) {
              console.log(`⏩ Skipping contact.deletion because contact.creation exists.`);
              continue;
            }
            console.log("🗑️ Contact Deleted Event Detected!");
            await contactDeleted(portalId, objectId);
            break;
    
          case "product.deletion":
            if (hasCreationEvent) {
              console.log(`⏩ Skipping product.deletion because product.creation exists.`);
              continue;
            }
            console.log("🗑️ Product Deleted Event Detected!");
            await productDeleted(portalId, objectId);
            break;
    
          case "company.deletion":
            if (hasCreationEvent) {
              console.log(`⏩ Skipping company.deletion because company.creation exists.`);
              continue;
            }
            console.log("🗑️ Company Deleted Event Detected!");
            await companyDeleted(portalId, objectId);
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
    console.log(error);
    console.error("❌ Error in processing webhook events:", error.message);
  }
}

// 🔄 Function to forward webhook event to the external URL
async function forwardWebhookEvent(eventData: any) {
  try {
    const ngrokURL =
      "https://e21f-49-205-245-106.ngrok-free.app/api/webhook/hubspot";

    const response = await fetch(ngrokURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: eventData,
    });

    if (!response.ok) {
      console.error("❌ Failed to forward webhook event:", response.statusText);
    } else {
      console.log("✅ Webhook event successfully forwarded");
    }
  } catch (error) {
    console.error("❌ Error forwarding webhook event:", error);
  }
}
