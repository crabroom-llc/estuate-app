import { getTokens } from "@/components/hubspotWebhookActivities/gettokens";
import { fetchProductById, updateHubSpotProduct } from "@/components/hubspotActions/hubspotActions";

import { updateStripeProduct } from "@/components/stripeActions/stripeActions";

const productUpdated = async (portalId, objectId, propertyName, propertyValue) => {
  try {
    const tokens = await getTokens(portalId);

    if (!tokens) {
      console.error("❌ Failed to retrieve access tokens.");
      return;
    }

    const { new_stripeAccessToken, new_hubspot_access_token } = tokens;

    const stripe_product_id = await fetchProductById(objectId, new_hubspot_access_token);
    // console.log("stripe_product_id", stripe_product_id.properties.stripe_product_id);
    if(!stripe_product_id){
      console.log("No stripe customer id found");
      return
    }
    const updatepriceidinhubspot = await updateStripeProduct(
        new_stripeAccessToken,
        propertyName,
        propertyValue,
        stripe_product_id.properties.stripe_product_id
      );
      console.log("data from update")
      if (updatepriceidinhubspot?.price_id) {
        await updateHubSpotProduct(
          objectId, 
          String(stripe_product_id.properties.stripe_product_id), // ✅ Convert to string
          String(updatepriceidinhubspot?.price_id), // ✅ Convert to string
          new_hubspot_access_token
        );
      }
      console.log("Closed updation");
      return;
  } catch (error) {
    console.error("❌ Error in productUpdated:", error);
  }
};



export { productUpdated };