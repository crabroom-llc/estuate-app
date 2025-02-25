import { getTokens } from "@/components/hubspotWebhookActivities/gettokens";
import {
    fetchProduct,
    updateHubSpotProduct, createusuagebasedHubSpotProperties
} from "@/components/hubspotActions/hubspotActions";
import { createProduct, createUsageBasedProductPerPackage, createUsageBasedProductPerTeir, createUsageBasedProductPerUnit } from "@/components/stripeActions/stripeActions";

const productCreated = async (portalId, object, query) => {
    try {
        const tokens = await getTokens(portalId, query);

        if (!tokens) {
            console.error("❌ Failed to retrieve access tokens.");
            return;
        }

        const { new_stripeAccessToken, new_hubspot_access_token } = tokens;

        // const productData = await fetchProduct(object, new_hubspot_access_token);

        // if (!productData) {
        //     console.error("❌ No product data found for HubSpot ID:", object);
        //     return null;
        // }
        // const productDescription = productData?.properties?.description;

        // if (productDescription?.includes("usagebased")) {
        //     console.log("The description contains 'usagebased'.");
        //     // await createusuagebasedHubSpotProperties(new_hubspot_access_token); 
        //     // when user provides oauth token for hubspot, we can create properties in hubspot
        //     return;
        // }
        // console.log("🔹 Product Data:", productData?.properties?.description);
        // const stripeProductResponse = await createProduct(
        //     new_stripeAccessToken,
        //     productData
        // );

        // if (!stripeProductResponse || !stripeProductResponse.productId) {
        //     console.error("❌ Failed to create product in Stripe.");
        //     return null;
        // }

        // // Extract `productId` before passing it to `updateHubSpotProduct`
        // const stripeProductId = stripeProductResponse.productId;
        // const stripePriceId = stripeProductResponse.priceId;

        // const updatedProduct = await updateHubSpotProduct(
        //     object,
        //     stripeProductId,
        //     stripePriceId,
        //     new_hubspot_access_token
        // );

        // console.log(
        //     "✅ Product processing completed successfully!",
        //     updatedProduct
        // );


        const usageModel = object.properties.usage_model;

        switch (usageModel) {
            case "per_unit":
                if (!object.properties.unit_price) {
                    console.log("No unit price found");
                    return;
                } else {
                    const stripeProductResponse = await createUsageBasedProductPerUnit(new_stripeAccessToken, object);
                    console.log("🚀 => stripeProductResponse:", stripeProductResponse);
                    if (!stripeProductResponse) {
                        console.error("❌ Failed to create usage-based product in Stripe.");
                        return;
                    }
                    const stripeProductId = stripeProductResponse.productId;
                    const stripePriceId = stripeProductResponse.priceId;
                    const stripeMeteredId = stripeProductResponse.meterId;

                    const updatedProduct = await updateHubSpotProduct(
                        object.id,
                        stripeProductId,
                        stripePriceId,
                        stripeMeteredId,
                        new_hubspot_access_token
                    );

                    console.log(
                        "✅ Product processing completed successfully!",
                        updatedProduct
                    );
                }
                break;
            case "per_package":
                if (!object.properties.package_price || !object.properties.package_units) {
                    console.log("No package price or unit found");
                    return;
                } else {
                    const stripeProductResponse = await createUsageBasedProductPerPackage(new_stripeAccessToken, object);
                    console.log("🚀 => stripeProductResponse:", stripeProductResponse);
                    if (!stripeProductResponse || !stripeProductResponse.priceId  || !stripeProductResponse.productId) {
                        console.error("❌ Failed to create usage-based product or priceId is undefined.");
                        return;
                      }
                      let stripeOverageId;
             

                    const stripeProductId = stripeProductResponse.productId ??"";
                    let stripePriceId = stripeProductResponse.priceId ?? "";
                      
                    if(!stripeProductResponse.overagePriceId){
                        stripeOverageId = "";
                    }
                    else{
                        stripeOverageId = stripeProductResponse.overagePriceId;
                        stripePriceId = stripeOverageId+","+stripePriceId
                    }
                    const stripeMeteredId = stripeProductResponse.meterId;
                    
                    const updatedProduct = await updateHubSpotProduct(
                        object.id,
                        stripeProductId,
                        stripePriceId,
                        stripeMeteredId,
                        new_hubspot_access_token
                    );

                    console.log(
                        "✅ Product processing completed successfully!",
                        updatedProduct
                    );
                }
                break;
            case "per_tier":
                if (!object.properties.tier_mode || !object.properties.tiers_json) {
                    console.log("No tier mode or tiers found");
                    return;
                } else {
                    const stripeProductResponse = await createUsageBasedProductPerTeir(new_stripeAccessToken, object);
                    console.log("🚀 => stripeProductResponse:", stripeProductResponse);
                    if (!stripeProductResponse) {
                        console.error("❌ Failed to create usage-based product in Stripe.");
                        return;
                    }
                    const stripeProductId = stripeProductResponse.productId;
                    const stripePriceId = stripeProductResponse.priceId;
                    const stripeMeteredId = stripeProductResponse.meterId;

                    const updatedProduct = await updateHubSpotProduct(
                        object.id,
                        stripeProductId,
                        stripePriceId,
                        stripeMeteredId,
                        new_hubspot_access_token
                    );

                    console.log(
                        "✅ Product processing completed successfully!",
                        updatedProduct
                    );
                }
        }



        return;
    } catch (error) {
        console.error("❌ Error in productCreated:", error);
    }
};

export { productCreated };
