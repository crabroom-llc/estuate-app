import { updateHubSpotCompanyFromStripe } from "@/components/hubspotActions/hubspotActions";
import { getStripeTokens } from "@/components/hubspotWebhookActivities/gettokens";
const companyUpdate = async (data: any, accountId: any, objectId: any, query:(sql: string, params?: any[]) => Promise<any>) => {
    try {
        const tokens = await getStripeTokens(accountId, query);

        if (!tokens) {
            console.error("❌ Failed to retrieve access tokens.");
            return;
        }

        const { new_stripeAccessToken, new_hubspot_access_token } = tokens;

        // 🔹 Step 4: Check if hubspot_company_id is present in metadata or not
        const hubspotCompanyId = data.object.metadata?.hubspot_company_id;
        if (!hubspotCompanyId) {
            console.log("❌ HubSpot Company ID not found in metadata.");
            return;
        }

        // 🔹 Step 5: Get updated values in key value order
        const updatedKeys = data.previous_attributes;
        let updatedValues: any;

        Object.keys(updatedKeys).forEach((key) => {
            if (data.object[key]) {
                if (key === "metadata") {
                    Object.keys(updatedKeys.metadata).forEach((metadataKey) => {
                        updatedValues = {
                            ...updatedValues,
                            [metadataKey]: data.object.metadata[metadataKey],
                        };
                    });
                } else if (key === "postal_code") {
                    updatedValues = {
                        ...updatedValues,
                        zip: data.object[key],
                    };
                }
                else {
                    updatedValues = {
                        ...updatedValues,
                        [key]: data.object[key],
                    };
                }
            }
        });

        // remove undefined values
        updatedValues = Object.keys(updatedValues).reduce((object: any, key) => {
            if (updatedValues[key] !== undefined) {
                object[key] = updatedValues[key];
            }
            return object;
        }, {});

        console.log("🔹 Updated Values:", updatedValues);
        // 🔹 Step 6: Update the company in Hubspot
        const companyUpdate = await updateHubSpotCompanyFromStripe(hubspotCompanyId, updatedValues, new_hubspot_access_token);
        console.log("🚀 => companyUpdate:", companyUpdate);
        console.log("✅ HubSpot Company Updated Successfully!");
    } catch (error) {
        console.error("❌ Error in companyUpdate:", error);
    }
};

export { companyUpdate };