import { updateHubSpotProductFromStripe } from "@/components/hubspotActions/hubspotActions";
import { getStripeTokens } from "@/components/hubspotWebhookActivities/gettokens";
const productUpdate = async (data: any, accountId: any, objectId: any) => {
    try {
        const tokens = await getStripeTokens(accountId);

        if (!tokens) {
            console.error("❌ Failed to retrieve access tokens.");
            return;
        }

        const { new_stripeAccessToken, new_hubspot_access_token } = tokens;

        // 🔹 Step 4: Check if hubspot_product_id is present in metadata or not
        const hubspotProductId = data.object.metadata?.hubspot_product_id;
        if (!hubspotProductId) {
            console.log("❌ HubSpot Product ID not found in metadata.");
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
                } else {
                    updatedValues = {
                        ...updatedValues,
                        [key]: data.object[key],
                    };
                }
            }
        });

        delete updatedValues.updated;
        // 🔹 Step 6: Update the product in Hubspot
        const productUpdate = await updateHubSpotProductFromStripe(hubspotProductId, updatedValues, new_hubspot_access_token);
        console.log("🚀 => productUpdate:", productUpdate);
        console.log("✅ HubSpot Product Updated Successfully!");
    } catch (error) {
        console.error("❌ Error in productUpdate:", error);
    }
};

export { productUpdate };