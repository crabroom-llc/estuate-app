import { getTokens } from "@/components/hubspotWebhookActivities/gettokens";
import {
  fetchProduct,
  updateHubSpotProduct, createusuagebasedHubSpotProperties
} from "@/components/hubspotActions/hubspotActions";
import { createProduct } from "@/components/stripeActions/stripeActions";

const productCreated = async (portalId, objectId, query) => {
  try {
    const tokens = await getTokens(portalId, query);

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
    const productDescription = productData?.properties?.description;

    if (productDescription?.includes("usagebased")) {
      console.log("The description contains 'usagebased'.");
      // await createusuagebasedHubSpotProperties(new_hubspot_access_token); 
      // when user provides oauth token for hubspot, we can create properties in hubspot
      return;
    }
    console.log("🔹 Product Data:", productData?.properties?.description);
    const stripeProductResponse = await createProduct(
      new_stripeAccessToken,
      productData
    );

    if (!stripeProductResponse || !stripeProductResponse.productId) {
      console.error("❌ Failed to create product in Stripe.");
      return null;
    }

    // Extract `productId` before passing it to `updateHubSpotProduct`
    const stripeProductId = stripeProductResponse.productId;
    const stripePriceId = stripeProductResponse.priceId;

    const updatedProduct = await updateHubSpotProduct(
      objectId,
      stripeProductId,
      stripePriceId,
      "",
      new_hubspot_access_token
    );

    console.log(
      "✅ Product processing completed successfully!",
      updatedProduct
    );
    return;
  } catch (error) {
    console.error("❌ Error in productCreated:", error);
  }
};

export { productCreated };
