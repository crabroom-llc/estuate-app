import { getTokens } from "@/components/hubspotWebhookActivities/gettokens";
import { fetchDealById, updateHubSpotDeal } from "@/components/hubspotActions/hubspotActions";
// import {processHubspotDealCreated} from "@/components/stripeActions/stripeActions";
import {processStripePayments} from "@/components/stripeActions/stripeActions";


const dealCreated = async (portalId, objectId, query) => {
    try {
        
        const tokens = await getTokens(portalId, query);

        if (!tokens) {
            console.error("❌ Failed to retrieve access tokens.");
            return;
        }

        const { new_stripeAccessToken, new_hubspot_access_token } = tokens;
        // console.log("✅ Deal created successfully!", new_stripeAccessToken, new_hubspot_access_token);
        const dealData = await fetchDealById(objectId, new_hubspot_access_token, new_stripeAccessToken);
        console.log(dealData);
        if(!dealData){
            console.log(`Deal stage is not in closed won current deal stage`)
            return null;
        }
        // const stripe_activity_id = processHubspotDealCreated(dealData, new_hubspot_access_token, new_stripeAccessToken)

        const createSubcription = await processStripePayments(dealData, new_stripeAccessToken);
        if (createSubcription) {
            const { dealId, invoices, subscriptions, amount } = createSubcription;
            console.log("✅ Final Data:", { dealId, invoices, subscriptions, amount });
          
            // ✅ Now update HubSpot with all collected IDs
            await updateHubSpotDeal(dealId, subscriptions, invoices, new_hubspot_access_token);
          } else {
            console.error("❌ Error: processStripePayments returned null. Cannot update HubSpot.");
          }
        
    } catch (error) {
        console.error("❌ Error in dealCreated:", error);
        
    }
}


export { dealCreated };