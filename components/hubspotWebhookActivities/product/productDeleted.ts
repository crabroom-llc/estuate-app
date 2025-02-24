import { getTokens } from "@/components/hubspotWebhookActivities/gettokens";
import { deleteStripeProduct, getProductStripeId } from "@/components/stripeActions/stripeActions";

const productDeleted = async (portalId, objectId, query) => {
    let connection;

    try {
        const tokens = await getTokens(portalId, query);

        if (!tokens) {
            console.error("❌ Failed to retrieve access tokens.");
            return;
        }

        const { new_stripeAccessToken, new_hubspot_access_token } = tokens;

        const stripe_product_id = await getProductStripeId(
            objectId,
            new_stripeAccessToken
        );

        const updateProduct = await deleteStripeProduct(
            new_stripeAccessToken,
            stripe_product_id
        );
        console.log("✅ Stripe Product Deleted:", updateProduct);
    } catch (error) {
        console.error("❌ Error in contactCreated:", error);
    } finally {
        if (connection) {
            try {
                connection.release();
            } catch (releaseError) {
                console.error("❌ Error releasing DB connection:", releaseError);
            }
        }
    }
};

export { productDeleted };
