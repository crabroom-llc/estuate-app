import { updateHubSpotContactFromStripe } from "@/components/hubspotActions/hubspotActions";
import { getStripeTokens } from "@/components/hubspotWebhookActivities/gettokens";
const customerUpdate = async (data: any, accountId: any, objectId: any) => {
    try {
        const tokens = await getStripeTokens(accountId);

        if (!tokens) {
            console.error("❌ Failed to retrieve access tokens.");
            return;
        }

        const { new_stripeAccessToken, new_hubspot_access_token } = tokens;

        // 🔹 Step 4: Check if hubspot_contact_id is present in metadata or not
        const hubspotContactId = data.object.metadata?.hubspot_contact_id;
        if (!hubspotContactId) {
            console.log("❌ HubSpot Contact ID not found in metadata.");
            return;
        }

        // 🔹 Step 5: Get updated values in key value order
        const updatedKeys = data.previous_attributes;
        let updatedValues: any;

        Object.keys(updatedKeys).forEach((key) => {
            if (data.object[key]) {
                if (key === "name") {
                    const name = data.object[key];
                    const names = name.split(" ");
                    const firstname = names[0];
                    const lastname = names.slice(1).join(" ");
                    updatedValues = {
                        ...updatedValues,
                        "firstname": firstname,
                        "lastname": lastname,
                    };
                } else {
                    updatedValues = {
                        ...updatedValues,
                        [key]: data.object[key],
                    };
                }
            }
        });
        // 🔹 Step 6: Update the contact in Hubspot
        const contactUpdate = await updateHubSpotContactFromStripe(hubspotContactId, updatedValues, new_hubspot_access_token);
        console.log("🚀 => contactUpdate:", contactUpdate);
        console.log("✅ HubSpot Contact Updated Successfully!");
    } catch (error) {
        console.error("❌ Error in customerUpdate:", error);
    }
};

export { customerUpdate };