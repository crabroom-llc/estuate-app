import {
  updateHubSpotContact,
  fetchHubSpotContact,
} from "@/components/hubspotActions/hubspotActions";
import { createStripeCustomer } from "@/components/stripeActions/stripeActions";
import { getTokens } from "@/components/hubspotWebhookActivities/gettokens";
const contactCreated = async (portalId: any, objectId: any, query:(sql: string, params?: any[]) => Promise<any>) => {
  try {
    const tokens = await getTokens(portalId, query);

    if (!tokens) {
      console.error("❌ Failed to retrieve access tokens.");
      return;
    }

    const { new_stripeAccessToken, new_hubspot_access_token } = tokens;

    // 🔹 Step 4: Fetch contact details from HubSpot
    const contact = await fetchHubSpotContact(
      objectId,
      new_hubspot_access_token
    );
    if (!contact) {
      console.error("❌ Failed to fetch HubSpot contact.");
      return;
    }

    // 🔹 Step 5: Create Stripe Customer
    // Call the function with the HubSpot contact ID
    const stripeCustomerId = await createStripeCustomer(
      contact,
      new_stripeAccessToken,
      objectId
    );

    if (!stripeCustomerId) {
      console.error("❌ Failed to create Stripe customer.");
      return;
    }

    // 🔹 Step 6: Store Stripe Customer ID in HubSpot
    await updateHubSpotContact(
      objectId,
      stripeCustomerId,
      new_hubspot_access_token
    );

    console.log("✅ Contact processing completed successfully!");
  } catch (error) {
    console.error("❌ Error in contactCreated:", error);
  }
};

export { contactCreated };
