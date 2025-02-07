// {
//     name: `${company.properties.name || ""}`,
//     email: company.properties.email || "",
//     phone: company.properties.phone || "",
//     address: {
//       city: company.properties.city || "",
//       state: company.properties.state || "",
//       postal_code: company.properties.zip || "",
//       country: company.properties.country || "",
//     },
//     metadata: {
//       hubspot_company_id: companyId, // ✅ Adding HubSpot Company ID
//       industry: company.properties.industry || "",
//       type: company.properties.type || "",
//       number_of_employees: company.properties.numberofemployees || "",
//       annual_revenue: company.properties.annualrevenue || "",
//       time_zone: company.properties.timezone || "",
//       description: company.properties.description || "",
//       linkedin_url: company.properties.linkedincompanyprofile || "",
//       deleted: "false",
//     },
//   }
import { updateHubSpotCompanyFromStripe } from "@/components/hubspotActions/hubspotActions";
import { getTokens } from "@/components/hubspotWebhookActivities/gettokens";
const companyUpdate = async (data: any, accountId: any, objectId: any) => {
    try {
        const tokens = await getTokens("49208579");

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