import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/utils/mysql";
import { createHmac, createHash, timingSafeEqual } from "crypto";
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
import { Json } from "sequelize/types/utils";
import {clearlogs} from "@/utils/restartServer";

const CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET || "";

export async function POST(request: NextRequest) {
  try {
    // console.log(
    //   JSON.stringify(Object.fromEntries(request.headers.entries()), null, 2)
    // );
    console.log(CLIENT_SECRET);
    const rawBody = await request.text();
    if (!rawBody) {
      console.error("❌ Empty request body received");
      return NextResponse.json(
        { message: "Empty request body" },
        { status: 400 }
      );
    }

    const headers = request.headers;
    const signatureVersion = headers.get("x-hubspot-signature-version");
    const signature = headers.get("x-hubspot-signature");
    const signatureV3 = headers.get("x-hubspot-signature-v3");
    const timestamp = headers.get("x-hubspot-request-timestamp");

    if (!signatureVersion) {
      console.error("❌ Missing X-HubSpot-Signature-Version header");
      return NextResponse.json(
        { message: "Unauthorized request" },
        { status: 400 }
      );
    }

    const method = request.method;
    const url = new URL(request.url);
    const uri = `${url.origin}${url.pathname}`;

    // 🔹 Validate the request signature
    let isValid = false;
    if (signatureVersion === "v1") {
      isValid = validateSignatureV1(signature, rawBody);
    } else if (signatureVersion === "v2") {
      isValid = validateSignatureV2(signature, method, uri, rawBody);
    } else if (signatureVersion === "v3") {
      if (!timestamp) {
        console.error(
          "❌ Missing X-HubSpot-Request-Timestamp for v3 validation"
        );
        return NextResponse.json(
          { message: "Unauthorized request" },
          { status: 400 }
        );
      }
      isValid = validateSignatureV3(
        signatureV3,
        method,
        uri,
        rawBody,
        timestamp
      );
    } else {
      console.error(
        "❌ Unknown X-HubSpot-Signature-Version:",
        signatureVersion
      );
      return NextResponse.json(
        { message: "Unauthorized request" },
        { status: 400 }
      );
    }

    if (!isValid) {
      console.error("❌ Signature validation failed");
      return NextResponse.json(
        { message: "Unauthorized request" },
        { status: 400 }
      );
    }

    console.log("✅ HubSpot request signature validated successfully");

    // ✅ Respond immediately to HubSpot
    const response = NextResponse.json(
      { message: "Webhook received, processing in background" },
      { status: 200 }
    );

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

    // 🚫 Skip processing if the event was triggered by Stripe
    if (parsedBody[0]?.changeSource === "INTEGRATION") {
      console.log(
        "🚫 Skipping HubSpot update because it was triggered by Stripe"
      );
      return response;
    }

    // 🚀 Process the webhook asynchronously
    processWebhookEvents(parsedBody, pool.query.bind(pool));

    return response;
  } catch (error: any) {
    console.error("❌ Error processing HubSpot webhook:", error.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// 🔹 Validate v1 signature
function validateSignatureV1(signature: string | null, body: string): boolean {
  if (!signature) return false;
  const sourceString = CLIENT_SECRET + body;
  const expectedHash = createHash("sha256").update(sourceString).digest("hex");
  return signature === expectedHash;
}

// 🔹 Validate v2 signature
function validateSignatureV2(
  signature: string | null,
  method: string,
  uri: string,
  body: string
): boolean {
  if (!signature) return false;
  const sourceString = `${CLIENT_SECRET}${method}${uri}${body}`;
  const expectedHash = createHash("sha256").update(sourceString).digest("hex");
  return signature === expectedHash;
}

// 🔹 Validate v3 signature
function validateSignatureV3(
  signature: string | null,
  method: string,
  uri: string,
  body: string,
  timestamp: string
): boolean {
  if (!signature) return false;

  // Reject if timestamp is older than 5 minutes
  const MAX_TIMESTAMP_DIFF = 5 * 60 * 1000;
  const requestTime = parseInt(timestamp, 10);
  if (Date.now() - requestTime > MAX_TIMESTAMP_DIFF) {
    console.error("❌ Request timestamp too old, rejecting request");
    return false;
  }

  const sourceString = `${method}${uri}${body}${timestamp}`;
  const expectedHmac = createHmac("sha256", CLIENT_SECRET)
    .update(sourceString)
    .digest("base64");

  return timingSafeEqual(Buffer.from(expectedHmac), Buffer.from(signature));
}

async function processWebhookEvents(parsedBody: any, query:(sql: string, params?: any[]) => Promise<any>) {
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
    // console.log(parsedBody);
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
    const [rows]: any[] = await query(`SELECT 1 FROM user_oauth WHERE hubspot_acc = ? LIMIT 1`, [portalId]);

    if (!rows || rows.length === 0) {
      console.error(
        "❌ Unauthorized HubSpot Account. Portal ID not found:",
        portalId
      );
      return;
    }

    // ✅ Check if any `.creation` event exists in the array
    const hasCreationEvent = parsedBody.some((event) =>
      event.subscriptionType.endsWith(".creation")
    );

    const hasCurrencyUpdated = parsedBody.some((event) =>
      event?.propertyName?.includes("currency")
    );

    // ✅ Track processed objectIds to ignore further events
    const processedObjects = new Set<string>();

    const processedEvents = new Set<string>();

    // ✅ Process Webhook Events
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
          continue;
        }
        console.log(`🔹 Parsedbody: ${JSON.stringify(event)}`);
        console.log(`🔹 Event Type: ${subscriptionType}`);
        console.log(`🔹 Object ID: ${objectId}`);

        // ✅ If at least one `.creation` event exists and we already processed this objectId, skip the rest
        if (hasCreationEvent && processedObjects.has(objectId)) {
          console.log(
            `⏩ Skipping event because ${objectId} was already processed.`
          );
          continue;
        }

        if (hasCurrencyUpdated && processedEvents.has(subscriptionType)) {
          console.log(
            `⏩ Skipping event because ${propertyName} was already processed.`
          );
          continue;
        }

        switch (subscriptionType) {
          case "contact.creation":
            console.log("✅ Contact Created Event Detected!");
            await contactCreated(portalId, objectId, query);
            processedObjects.add(objectId);
            
            break;

          case "product.creation":
            console.log("✅ Product Created Event Detected!");
            await productCreated(portalId, objectId, query);
            processedObjects.add(objectId);
            clearlogs();
            break;

          case "deal.creation":
            console.log("✅ Deal Created Event Detected!");
            await dealCreated(portalId, objectId, query);
            processedObjects.add(objectId);
           
            break;

          case "company.creation":
            console.log("✅ Company Created Event Detected!");
            await companyCreated(portalId, objectId, query);
            processedObjects.add(objectId);
            clearlogs();
            break;

          case "contact.propertyChange":
            if (hasCreationEvent) {
              console.log(
                `⏩ Skipping contact.propertyChange because contact.creation exists.`
              );
              continue;
            }
            console.log("✏️ Contact Property Changed Event Detected!");
            await contactUpdated(
              portalId,
              objectId,
              propertyName,
              propertyValue,
              query
            );
            break;

          case "product.propertyChange":
            if (hasCreationEvent) {
              console.log(
                `⏩ Skipping product.propertyChange because product.creation exists.`
              );
              continue;
            }
            console.log("✏️ Product Property Changed Event Detected!");
            await productUpdated(
              portalId,
              objectId,
              propertyName,
              propertyValue,
              query
            );
            processedEvents.add(subscriptionType);
            clearlogs();
            break;

          case "deal.propertyChange":
            if (hasCreationEvent) {
              console.log(
                `⏩ Skipping deal.propertyChange because deal.creation exists.`
              );
              continue;
            }
            console.log("✏️ Deal Property Changed Event Detected!");
            await dealUpdated(portalId, objectId, propertyName, propertyValue, query);
            break;

          case "company.propertyChange":
            if (hasCreationEvent) {
              console.log(
                `⏩ Skipping company.propertyChange because company.creation exists.`
              );
              continue;
            }
            console.log("✏️ Company Property Changed Event Detected!");
            await companyUpdated(
              portalId,
              objectId,
              propertyName,
              propertyValue,
              query
            );
            break;

          case "contact.deletion":
            if (hasCreationEvent) {
              console.log(
                `⏩ Skipping contact.deletion because contact.creation exists.`
              );
              continue;
            }
            console.log("🗑️ Contact Deleted Event Detected!");
            await contactDeleted(portalId, objectId, query);
            break;

          case "product.deletion":
            if (hasCreationEvent) {
              console.log(
                `⏩ Skipping product.deletion because product.creation exists.`
              );
              continue;
            }
            console.log("🗑️ Product Deleted Event Detected!");
            await productDeleted(portalId, objectId, query);
            break;

          case "company.deletion":
            if (hasCreationEvent) {
              console.log(
                `⏩ Skipping company.deletion because company.creation exists.`
              );
              continue;
            }
            console.log("🗑️ Company Deleted Event Detected!");
            await companyDeleted(portalId, objectId, query);
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


