import { pool } from "@/utils/mysql";
import { getStripeAccessTokenWebhook } from "@/components/api/stripe/Oauth/getAccesscode";
import { gethubspotaccesstokenWebhook } from "@/components/api/hubspot/Oauth/getAccesscode";




const getTokens = async (portalId: any) => {
  let connection;

  try {
    connection = await pool.getConnection();

    // 🔹 Step 1: Retrieve Tokens from Database
    const [rows]: any[] = await connection.query(
      `SELECT 
              usd.stripe_refresh_token, 
              usd.stripe_access_token, 
              uhd.hubspot_access_token, 
              uhd.hubspot_refresh_token 
           FROM estuate.user_oauth uo
           JOIN estuate.user_stripe_data usd ON uo.user_id = usd.user_id
           JOIN estuate.user_hubspot_data uhd ON uo.user_id = uhd.user_id
           WHERE uo.hubspot_acc = ?`,
      [portalId]
    );

    if (rows.length === 0) {
      console.error("❌ No matching user found for portal:", portalId);
      return null; // Return null instead of silent failure
    }

    let {
      stripe_refresh_token,
      hubspot_refresh_token,
      hubspot_access_token,
      stripe_access_token,
    } = rows[0];

    // 🚀 Ensure refresh tokens exist before proceeding
    if (!stripe_refresh_token || !hubspot_refresh_token) {
      console.error("❌ Missing required refresh tokens for portal:", portalId);
      return null;
    }

    console.log(`🔹 Retrieved Stripe Refresh Token: ${stripe_refresh_token}`);
    console.log(`🔹 Retrieved HubSpot Access Token: ${hubspot_access_token || "None (Will Refresh)"}`);

    // 🔹 Step 2: Refresh HubSpot Access Token
    let new_hubspot_access_token = await gethubspotaccesstokenWebhook(
      hubspot_refresh_token,
      hubspot_access_token
    );

    if (!new_hubspot_access_token) {
      console.error("❌ Failed to refresh HubSpot access token.");
      return null;
    }

    // 🔹 Step 3: Exchange `stripe_refresh_token` for `stripe_access_token`
    const new_stripeAccessToken = await getStripeAccessTokenWebhook(
      stripe_refresh_token,
      stripe_access_token
    );

    if (!new_stripeAccessToken) {
      console.error("❌ Failed to get Stripe access token.");
      return null;
    }

    return { new_stripeAccessToken, new_hubspot_access_token };
  } catch (error) {
    console.error("❌ Error in getTokens:", error);
    return null; // Ensure null is returned on failure
  } finally {
    if (connection) connection.release(); // ✅ Always release DB connection
  }
};

const getStripeTokens = async (portalId: any) => {
  let connection;

  try {
    connection = await pool.getConnection();

    // 🔹 Step 1: Retrieve Tokens from Database
    const [rows]: any[] = await connection.query(
      `SELECT 
              usd.stripe_refresh_token, 
              usd.stripe_access_token, 
              uhd.hubspot_access_token, 
              uhd.hubspot_refresh_token 
           FROM estuate.user_oauth uo
           JOIN estuate.user_stripe_data usd ON uo.user_id = usd.user_id
           JOIN estuate.user_hubspot_data uhd ON uo.user_id = uhd.user_id
           WHERE uo.stripe_acc = ?`,
      [portalId]
    );

    if (rows.length === 0) {
      console.error("❌ No matching user found for portal:", portalId);
      return null; // Return null instead of silent failure
    }

    let {
      stripe_refresh_token,
      hubspot_refresh_token,
      hubspot_access_token,
      stripe_access_token,
    } = rows[0];

    // 🚀 Ensure refresh tokens exist before proceeding
    if (!stripe_refresh_token || !hubspot_refresh_token) {
      console.error("❌ Missing required refresh tokens for portal:", portalId);
      return null;
    }

    console.log(`🔹 Retrieved Stripe Refresh Token: ${stripe_refresh_token}`);
    console.log(`🔹 Retrieved HubSpot Access Token: ${hubspot_access_token || "None (Will Refresh)"}`);

    // 🔹 Step 2: Refresh HubSpot Access Token
    let new_hubspot_access_token = await gethubspotaccesstokenWebhook(
      hubspot_refresh_token,
      hubspot_access_token
    );

    if (!new_hubspot_access_token) {
      console.error("❌ Failed to refresh HubSpot access token.");
      return null;
    }

    // 🔹 Step 3: Exchange `stripe_refresh_token` for `stripe_access_token`
    const new_stripeAccessToken = await getStripeAccessTokenWebhook(
      stripe_refresh_token,
      stripe_access_token
    );

    if (!new_stripeAccessToken) {
      console.error("❌ Failed to get Stripe access token.");
      return null;
    }

    return { new_stripeAccessToken, new_hubspot_access_token };
  } catch (error) {
    console.error("❌ Error in getTokens:", error);
    return null; // Ensure null is returned on failure
  } finally {
    if (connection) connection.release(); // ✅ Always release DB connection
  }
};

export { getTokens, getStripeTokens };
