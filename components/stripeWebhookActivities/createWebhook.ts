import Stripe from "stripe";
import { getTokens } from "@/components/hubspotWebhookActivities/gettokens";
// const STRIPE_CLIENT_SECRET = process.env.STRIPE_CLIENT_SECRET || "";


async function createStripeWebhook() {
    try {
        console.log("🚀 Creating Stripe webhook...");
        const tokens = await getTokens("49208579");

        if (!tokens) {
            console.error("❌ Failed to retrieve access tokens.");
            return;
        }

        const { new_stripeAccessToken, new_hubspot_access_token } = tokens;

        const stripe = new Stripe(new_stripeAccessToken, {
            apiVersion: "2023-10-16" as any,
        });

        console.log("🚀 => Stripe instance initialized");

        const webhookEndpoint = await stripe.webhookEndpoints.create({
            url: "https://558d-2409-40c4-30c3-4bdd-e19f-7c90-e22a-2620.ngrok-free.app/api/stripe-webhook", // Remove `?`
            enabled_events: [
                "checkout.session.completed",
                "invoice.payment_succeeded",
                "customer.subscription.created",
                "customer.subscription.updated",
                "customer.subscription.deleted",
            ],
            description: "Webhook for handling Stripe events",
        });

        console.log("✅ Webhook Created:", webhookEndpoint);
        console.log("🔑 Webhook Secret:", webhookEndpoint.secret);
    } catch (error) {
        console.error("❌ Error creating webhook:", error);
    }
}

export { createStripeWebhook };
