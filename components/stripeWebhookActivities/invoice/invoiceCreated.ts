import {
    updateHubSpotDealPaymentStatus,appendInvoiceToHubSpotHistory
} from "@/components/hubspotActions/hubspotActions";
import { checkPaymentMethod, fetchStripeInvoice } from "@/components/stripeActions/stripeActions";
import { getStripeTokens } from "@/components/hubspotWebhookActivities/gettokens";
import fs from 'fs';
const invoiceCreated = async (portalId: any, objectId: any) => {
    try {
        const tokens = await getStripeTokens(portalId);

        if (!tokens) {
            console.error("❌ Failed to retrieve access tokens.");
            return;
        }

        const { new_stripeAccessToken, new_hubspot_access_token } = tokens;

        // 🔹 Step 4: Fetch invoice details from Stripe
        const invoice = await fetchStripeInvoice(
            objectId,
            new_stripeAccessToken
        );
        if (!invoice) {
            console.error("❌ Failed to fetch Stripe invoice.");
            return;
        }
        // const dealId = invoice?.subscription_details?.metadata?.deal_id;
        const dealId = invoice?.subscription_details?.metadata?.deal_id || invoice?.metadata?.deal_id; 
        const paymentPaidDate = invoice?.created;
        const paymentStatus = invoice?.status;
        const invoice_id = objectId;
        console.log("🔹 Deal ID:", dealId)
        console.log("🔹 Payment Status:", paymentStatus);
        console.log("🔹 Payment Paid Date:", paymentPaidDate);

        // 🔹 Step 5: Add a new property in hubspot deal
        // await createHubSpotDealPropertyPaymentPaidDate(new_hubspot_access_token)

        // await checkPaymentMethod(portalId, new_stripeAccessToken,invoice_id);
        // 🔹 Step 6: Update the deal in HubSpot
        if (dealId && paymentStatus && paymentPaidDate) {
            await appendInvoiceToHubSpotHistory(dealId, invoice_id, paymentStatus, paymentPaidDate, new_hubspot_access_token);
        } else {
            console.error("❌ Deal ID is undefined.");
        }
        console.log("✅ HubSpot Deal Updated Successfully!");
    } catch (error) {
        console.error("❌ Error in invoicePaid:", error);
    }
};

export { invoiceCreated };
