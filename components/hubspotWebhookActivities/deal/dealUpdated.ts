import { getTokens } from "@/components/hubspotWebhookActivities/gettokens";
import {
  fetchDealById,
  updateHubSpotDeal,fetchdealStripedetailById
} from "@/components/hubspotActions/hubspotActions";
// import {processHubspotDealCreated} from "@/components/stripeActions/stripeActions";
import { processStripePayments, updateStripeSubscriptionWithUsage } from "@/components/stripeActions/stripeActions";
import { hubspotAccessCode } from "@/components/api/hubspot/Oauth/Oauth";

const dealUpdated = async (portalId, objectId, propertyName, propertyValue) => {
  const tokens = await getTokens(portalId);
  if (!tokens) {
    console.error("❌ Failed to retrieve access tokens.");
    return;
  }

  const { new_stripeAccessToken, new_hubspot_access_token } = tokens;
  try {
    if (propertyName == "dealstage" && propertyValue == "closedwon") {
      

      // console.log("✅ Deal created successfully!", new_stripeAccessToken, new_hubspot_access_token);
      const dealData = await fetchDealById(
        objectId,
        new_hubspot_access_token,
        new_stripeAccessToken
      );
      console.log(dealData);
      // const stripe_activity_id = processHubspotDealCreated(dealData, new_hubspot_access_token, new_stripeAccessToken)

      const createSubcription = await processStripePayments(
        dealData,
        new_stripeAccessToken
      );
      if (createSubcription) {
        const { dealId, invoices, subscriptions } = createSubcription;
        console.log("✅ Final Data:", { dealId, invoices, subscriptions });

        // ✅ Now update HubSpot with all collected IDs
        await updateHubSpotDeal(
          dealId,
          subscriptions,
          invoices,
          new_hubspot_access_token
        );
      } else {
        console.error(
          "❌ Error: processStripePayments returned null. Cannot update HubSpot."
        );
      }
      return;
    } else if (propertyName == "usage_records") {

      // Fetch the deal data
      const dealData = await fetchDealById(
        objectId,
        new_hubspot_access_token,
        new_stripeAccessToken
      );
      console.log(dealData);

      // Update the subscription with the new usage records
      if (dealData?.properties?.stripe_invoice_id && dealData?.properties?.stripe_subscription_id) {
        const updateSubscription = await updateStripeSubscriptionWithUsage(
          dealData?.properties?.stripe_subscription_id,
          propertyValue,
          new_stripeAccessToken
        )
        console.log("🚀 => updateSubscription:", updateSubscription);
        if (updateSubscription) {
          console.log("✅ Usage records updated successfully!");
        } else {
          console.error("❌ Error: updateStripeSubscriptionWithUsage returned null. Cannot update HubSpot.");
        }
        return;
      }
    }
    // await fetchdealStripedetailById(objectId, new_hubspot_access_token);
  } catch (error) {}
};


export {dealUpdated};