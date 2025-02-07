import { getTokens } from "@/components/hubspotWebhookActivities/gettokens";
import { deleteStripeCustomer, getCustomerStripeId } from "@/components/stripeActions/stripeActions";

const contactDeleted = async (portalId, objectId) => {
  let connection;

  try {
    const tokens = await getTokens(portalId);

    if (!tokens) {
      console.error("❌ Failed to retrieve access tokens.");
      return;
    }

    const { new_stripeAccessToken, new_hubspot_access_token } = tokens;

    const stripe_customer_id = await getCustomerStripeId(
      objectId,
      new_stripeAccessToken
    );

    const updateCustomer = await deleteStripeCustomer(
      new_stripeAccessToken,
      stripe_customer_id
    );
    console.log("✅ Stripe Customer Deleted:", updateCustomer);
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