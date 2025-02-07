import {
    updateHubSpotCompany,
    fetchHubSpotCompany,
} from "@/components/hubspotActions/hubspotActions";
import { createStripeCompany } from "@/components/stripeActions/stripeActions";
import { getTokens } from "@/components/hubspotWebhookActivities/gettokens";
const companyCreated = async (portalId: any, objectId: any) => {
    try {
        const tokens = await getTokens(portalId);

        if (!tokens) {
            console.error("❌ Failed to retrieve access tokens.");
            return;
        }

        const { new_stripeAccessToken, new_hubspot_access_token } = tokens;

        // 🔹 Step 4: Fetch company details from HubSpot
        const company = await fetchHubSpotCompany(
            objectId,
            new_hubspot_access_token
        );
        if (!company) {
            console.error("❌ Failed to fetch HubSpot company.");
            return;
        }

        // 🔹 Step 5: Create Stripe Company
        // Call the function with the HubSpot company ID
        const stripeCompanyId = await createStripeCompany(
            company,
            new_stripeAccessToken,
            objectId
        );

        if (!stripeCompanyId) {
            console.error("❌ Failed to create Stripe company.");
            return;
        }

        // 🔹 Step 6: Store Stripe Company ID in HubSpot
        await updateHubSpotCompany(
            objectId,
            stripeCompanyId,
            new_hubspot_access_token
        );

        console.log("✅ Company processing completed successfully!");
    } catch (error) {
        console.error("❌ Error in companyCreated:", error);
    }
};

export { companyCreated };
