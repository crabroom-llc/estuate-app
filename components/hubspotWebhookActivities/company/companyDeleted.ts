import { getTokens } from "@/components/hubspotWebhookActivities/gettokens";
import { deleteStripeCompany, getCompanyStripeId } from "@/components/stripeActions/stripeActions";

const companyDeleted = async (portalId, objectId) => {
  let connection;

  try {
    const tokens = await getTokens(portalId);

    if (!tokens) {
      console.error("❌ Failed to retrieve access tokens.");
      return;
    }

    const { new_stripeAccessToken, new_hubspot_access_token } = tokens;

    const stripe_company_id = await getCompanyStripeId(
      objectId,
      new_stripeAccessToken
    );
    console.log("🚀 => stripe_company_id:", stripe_company_id);

    const deletedCompany = await deleteStripeCompany(
      new_stripeAccessToken,
      stripe_company_id
    );
    console.log("✅ Stripe Company Deleted:", deletedCompany);
  } catch (error) {
    console.error("❌ Error in companyCreated:", error);
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

export { companyDeleted };
