import axios from "axios";
import { pool } from "@/utils/mysql";
import moment from "moment";

const HUBSPOT_CLIENT_ID = process.env.HUBSPOT_CLIENT_ID;
const HUBSPOT_CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET;

const gethubspotaccesstoken = async (refreshToken: string) => {
  try {
    const response = await axios.post(
      "https://api.hubapi.com/oauth/v1/token",
      null,
      {
        params: {
          grant_type: "refresh_token",
          client_id: HUBSPOT_CLIENT_ID,
          client_secret: HUBSPOT_CLIENT_SECRET,
          refresh_token: refreshToken,
        },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    console.log(
      "✅ HubSpot Access Token Refreshed:",
      response.data.access_token
    );
    return response.data.access_token;
  } catch (error) {
    console.error("❌ Error refreshing HubSpot token:", error);
    return null;
  }
};
const gethubspotaccesstokenWebhook = async (
  refreshToken: string,
  hubspot_access_token: string
) => {
  let connection;
  try {
    connection = await pool.getConnection();

    // Fetch the last updated time
    const [rows]: any[] = await connection.query(
      `SELECT updated_at, hubspot_access_token FROM user_hubspot_data WHERE hubspot_access_token = ?`,
      [hubspot_access_token]
    );

    if (rows.length === 0) {
      console.log("No user found for the given access token.");
      return null;
    }

    const { updated_at, hubspot_access_token: existingToken } = rows[0];
    // Convert `updated_at` to a real UTC Date object

    // Convert `updated_at` to a Date object
    let dbDate = new Date(updated_at);

    // Manually adjust if necessary (force UTC conversion)
    dbDate = moment.utc(dbDate).subtract(5, "hours").toDate();

    // Convert the adjusted timestamp to a Moment.js object
    const lastUpdatedTime = moment.utc(dbDate);

    // Get current UTC time
    const currentTime = moment.utc();

    // Calculate difference in minutes
    const diffInMinutes = currentTime.diff(lastUpdatedTime, "minutes");

    // Debug logs
    // console.log("📌 Raw updated_at from DB:", updated_at);
    // console.log(
    //   "📌 Converted DB Date Object (Adjusted to UTC):",
    //   dbDate.toISOString()
    // );
    // console.log("📌 Parsed lastUpdatedTime (UTC):", lastUpdatedTime.format());
    // console.log("📌 Current UTC Time:", currentTime.format());
    console.log(`⏳ Time difference hubspot: ${diffInMinutes} minutes`);
    // console.log("🖥️ System Local Time:", new Date().toString());
    if (diffInMinutes > 0) {
      console.log("HubSpot access token expired. Refreshing...");
      // Generate new access token (Replace this with actual token generation logic)
      const newAccessToken = await gethubspotaccesstoken(refreshToken);

      // Update the new access token in the database
      await connection.query(
        `UPDATE user_hubspot_data SET hubspot_access_token = ?, updated_at = UTC_TIMESTAMP() WHERE hubspot_access_token = ?`,
        [newAccessToken, hubspot_access_token]
      );

      console.log(
        "New Hubspot access token generated and updated in the database."
      );
      return newAccessToken;
    } else {
      console.log("Returning existing access token.");
      return existingToken;
    }
  } catch (error) {
    console.error("❌ Error refreshing HubSpot token:", error);
    return null;
  }
};

export { gethubspotaccesstoken, gethubspotaccesstokenWebhook };
