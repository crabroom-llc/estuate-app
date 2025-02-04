import { getTokens } from "@/components/hubspotWebhookActivities/gettokens";
import { fetchProduct, updateHubSpotProduct } from "@/components/hubspotActions/hubspotActions";
import { createProduct } from "@/components/stripeActions/stripeActions";

const productCreated = async (portalId, objectId) =>{
try {
  
  const tokens = await getTokens(portalId);

  if (!tokens) {
    console.error("❌ Failed to retrieve access tokens.");
    return;
  }

  const { new_stripeAccessToken, new_hubspot_access_token } = tokens; 
    
  const productData = await fetchProduct(objectId, new_hubspot_access_token);

  if (!productData) {
    console.error("❌ No product data found for HubSpot ID:", objectId);
    return null;
  }
  
  const stripeProductResponse = await createProduct(new_stripeAccessToken, productData);

  if (!stripeProductResponse || !stripeProductResponse.productId) {
    console.error("❌ Failed to create product in Stripe.");
    return null;
  }
  
  // Extract `productId` before passing it to `updateHubSpotProduct`
  const stripeProductId = stripeProductResponse.productId;

  const updatedProduct = await updateHubSpotProduct(objectId, stripeProductId, new_hubspot_access_token);
  console.log("✅ Product processing completed successfully!", updatedProduct);
} catch (error) {
  console.error("❌ Error in productCreated:", error);
  
}

};


export { productCreated };