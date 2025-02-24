import { getTokens } from "@/components/hubspotWebhookActivities/gettokens";
import { fetchCompanyStripeId } from "@/components/hubspotActions/hubspotActions";
import { updateStripeCompany } from "@/components/stripeActions/stripeActions";

const companyUpdated = async (
  portalId,
  objectId,
  propertyName,
  propertyValue,
  query
) => {
  // console.log(portalId, propertyName, propertyValue);
  let connection;
  try {
    const tokens = await getTokens(portalId, query);

    if (!tokens) {
      console.error("❌ Failed to retrieve access tokens.");
      return;
    }

    const { new_stripeAccessToken, new_hubspot_access_token } = tokens;
    const stripe_company_id = await fetchCompanyStripeId(
      objectId,
      new_hubspot_access_token
    );
    const updateCompany = await updateStripeCompany(
      new_stripeAccessToken,
      propertyName,
      propertyValue,
      stripe_company_id
    );
    console.log("✅ Stripe Company Updated:", updateCompany);
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

export { companyUpdated };
