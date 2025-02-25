import { getTokens } from "@/components/hubspotWebhookActivities/gettokens";
import {
  fetchDealById,
  updateHubSpotDeal,
} from "@/components/hubspotActions/hubspotActions";
// import {processHubspotDealCreated} from "@/components/stripeActions/stripeActions";
import { processStripePayments } from "@/components/stripeActions/stripeActions";
import { Json } from "sequelize/types/utils";

const dealCreated = async (portalId, objectId, query) => {
  try {
    const tokens = await getTokens(portalId, query);

    if (!tokens) {
      console.error("❌ Failed to retrieve access tokens.");
      return;
    }

    const { new_stripeAccessToken, new_hubspot_access_token } = tokens;
    // console.log("✅ Deal created successfully!", new_stripeAccessToken, new_hubspot_access_token);
    const dealDataRaw = await fetchDealById(
      objectId,
      new_hubspot_access_token,
      new_stripeAccessToken
    );

    if (!dealDataRaw) {
      console.log(
        `❌ Deal stage is not in closed won. Current deal stage invalid.`
      );
      return null;
    }

    console.log("✅ Deal Data:", JSON.stringify(dealDataRaw));

    // ✅ Ensure dealData has a proper structure before passing to processStripePayments
    const dealData: {
      dealId: string;
      customer: string[];
      amount: number;
      products?: {
        stripeProductId: string;
        stripePriceId: string;
        type: string;
        interval?: string;
        interval_count?: number;
        quantity: number;
      }[];
    } = {
      dealId: String(dealDataRaw.dealId), // ✅ Ensure it's a string
      customer: dealDataRaw.customer || [], // ✅ Default to an empty array if missing
      amount: dealDataRaw.amount ?? 0, // ✅ Default amount to 0 if missing
      products: dealDataRaw.products?.map((product) => ({
        stripeProductId: product.stripeProductId,
        stripePriceId: product.stripePriceId,
        type: product.type,
        interval: product.interval || "month", // ✅ Ensure default value
        interval_count: product.interval_count ?? 1, // ✅ Ensure default value
        quantity: product.quantity,
      })),
    };

    // const stripe_activity_id = processHubspotDealCreated(dealData, new_hubspot_access_token, new_stripeAccessToken)

    const createSubcription = await processStripePayments(
      dealData,
      new_stripeAccessToken
    );
    if (createSubcription) {
      const { dealId, invoices, subscriptions, amount } = createSubcription;
      console.log("✅ Final Data:", {
        dealId,
        invoices,
        subscriptions,
        amount,
      });

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
  } catch (error) {
    console.error("❌ Error in dealCreated:", error);
  }
};

export { dealCreated };
