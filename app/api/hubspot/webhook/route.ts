import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("🔔 HubSpot Webhook Event Received:", body);

    // Process the webhook event
    if (body && body.length > 0) {
      for (const event of body) {
        console.log(body)
        console.log(`🔹 Event Type: ${event.subscriptionType}`);
        console.log(`🔹 Object ID: ${event.objectId}`);
      }
    }

    return NextResponse.json({ message: "Webhook received successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Error processing webhook:", error.message);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
