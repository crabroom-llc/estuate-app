import axios from "axios";
import { pool } from "@/utils/mysql";
import moment from "moment";

const STRIPE_CLIENT_ID = process.env.STRIPE_CLIENT_ID;
const STRIPE_CLIENT_SECRET = process.env.STRIPE_CLIENT_SECRET;

/**
 * Function to refresh Stripe access token
 */
const getStripeAccessToken = async (refreshToken: string) => {
  try {
    const response = await axios.post(
      "https://connect.stripe.com/oauth/token",
      {
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: STRIPE_CLIENT_ID,
        client_secret: STRIPE_CLIENT_SECRET,
      }
    );

    console.log(
      "✅ Retrieved Stripe Access Token:",
      response.data.access_token
    );
    return response.data.access_token;
  } catch (error) {
    console.error("❌ Error fetching Stripe access token:", error);
    return null;
  }
};

/**
 * Function to check and refresh the Stripe access token if expired (Webhook Use Case)
 */
const getStripeAccessTokenWebhook = async (
  refreshToken: string,
  stripe_access_token: string
) => {
  let connection;
  try {
    connection = await pool.getConnection();

    // Fetch the last updated time
    const [rows]: any[] = await connection.query(
      `SELECT updated_at, stripe_access_token, stripe_expiry_time FROM user_stripe_data WHERE stripe_access_token = ?`,
      [stripe_access_token]
    );

    if (rows.length === 0) {
      console.log("❌ No user found for the given Stripe access token.");
      return null;
    }

    const { updated_at, stripe_access_token: existingToken, stripe_expiry_time } = rows[0];

    // Convert `updated_at` to a Date object
    let dbDate = new Date(stripe_expiry_time);

    // Manually adjust if necessary (force UTC conversion)
    dbDate = moment.utc(dbDate).subtract(5, "hours").toDate();

    // Convert the adjusted timestamp to a Moment.js object
    const expiryTime = moment.utc(dbDate);

    // Get current UTC time
    const currentTime = moment.utc();

    // Calculate difference in minutes
    const diffInMinutes = expiryTime.diff(currentTime, "minutes");

    // Debug logs
    // console.log("📌 Raw updated_at from DB:", updated_at);
    // console.log(
    //   "📌 Converted DB Date Object (Adjusted to UTC):",
    //   dbDate.toISOString()
    // );
    // console.log("📌 Parsed expiryTime (UTC):", expiryTime.format());
    // console.log("📌 Current UTC Time:", currentTime.format());
    console.log(`⏳ Time difference stripe : ${diffInMinutes} minutes`);
    // console.log("🖥️ System Local Time:", new Date().toString());

    if (diffInMinutes <= 0) {
      console.log("⏳ Stripe access token expired. Refreshing...");
      // Generate a new access token (must await this call)
      const newAccessToken = await getStripeAccessToken(refreshToken);
      const expiry_time = new Date(Date.now() + 24 * 60 * 60 * 1000) // Add 24 hours
        .toISOString()
        .slice(0, 19)
        .replace("T", " "); // Convert to MySQL DATETIME format


      if (!newAccessToken) {
        console.error("❌ Failed to generate new Stripe access token.");
        return null;
      }

      // Update the new access token in the database
      await connection.query(
        `UPDATE user_stripe_data SET stripe_access_token = ?, updated_at = UTC_TIMESTAMP(), stripe_expiry_time = ? WHERE stripe_access_token = ?`,
        [newAccessToken, expiry_time, stripe_access_token]
      );

      console.log(
        "✅ New Stripe access token generated and updated in the database."
      );
      return newAccessToken;
    } else {
      console.log("✅ Returning existing Stripe access token.");
      return existingToken;
    }
  } catch (error) {
    console.error("❌ Error in getStripeAccessTokenWebhook:", error);
    return null;
  } finally {
    if (connection) connection.release();
  }
};

export { getStripeAccessToken, getStripeAccessTokenWebhook };
