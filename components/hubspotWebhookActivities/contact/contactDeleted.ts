import { getTokens } from "@/components/hubspotWebhookActivities/gettokens";
import { fetchContactStripeId } from "@/components/hubspotActions/hubspotActions";
import { updateStripeCustomer } from "@/components/stripeActions/stripeActions";

const contactDeleted = async (portalId, objectId) => {
  let connection;

  try {
    const tokens = await getTokens(portalId);

    if (!tokens) {
      console.error("❌ Failed to retrieve access tokens.");
      return;
    }

    const { new_stripeAccessToken, new_hubspot_access_token } = tokens;

    const stripe_customer_id = await fetchContactStripeId(
      objectId,
      new_hubspot_access_token
    );

    const updateCustomer = await updateStripeCustomer(
      new_stripeAccessToken,
      "deleted",
      "true",
      stripe_customer_id
    );
    console.log("✅ Stripe Customer Updated:", updateCustomer);
  } catch (error) {
    console.error("❌ Error in contactCreated:", error);
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch (releaseError) {
        console.error("❌ Error releasing DB connection:", releaseError);
      }
    }
  }
};

export { contactDeleted };
