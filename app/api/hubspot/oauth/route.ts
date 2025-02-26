import { NextResponse } from "next/server";
import privateRoute from "@/utils/privateRoute";
import { pool } from "@/utils/mysql";
import { successObj } from "@/utils/responseObj";
import { createusuagebasedHubSpotProperties } from "@/components/hubspotActions/hubspotActions";

const HUBSPOT_CLIENT_ID = process.env.HUBSPOT_CLIENT_ID;
const HUBSPOT_REDIRECT_URI = process.env.HUBSPOT_REDIRECT_URI as string;
const HUBSPOT_AUTH_URL = process.env.HUBSPOT_AUTH_URL;
const HUBSPOT_SCOPE = process.env.HUBSPOT_SCOPE;
const HUBSPOT_CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET;
const HUBSPOT_TOKEN_URL = process.env.HUBSPOT_TOKEN_URL as string;
const HUBSPOT_USER_INFO_URL = "https://api.hubapi.com/oauth/v1/access-tokens/";

// Generate HubSpot OAuth URL
export async function GET(request: Request) {
  try {
    // Validate JWT token
    const userData = await privateRoute(request);

    // Generate OAuth URL
    const hubspotOauthUrl = `${HUBSPOT_AUTH_URL}?client_id=${HUBSPOT_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      HUBSPOT_REDIRECT_URI
    )}&scope=${HUBSPOT_SCOPE}&response_type=code`;

    console.log("HubSpot OAuth URL:", hubspotOauthUrl);

    return NextResponse.json({
      message: "HubSpot OAuth URL generated successfully",
      url: hubspotOauthUrl,
    });
  } catch (error:any) {
    console.error("Error in GET:", error.message);
    return NextResponse.json(
      { message: "Unauthorized: Invalid or expired token" },
      { status: 401 }
    );
  }
}

// Handle HubSpot OAuth token exchange and save to DB
export async function POST(request: Request) {
  try {
    const { code, userId } = await request.json();
    console.log("User ID:", userId);

    if (!code || !userId || userId == 0) {
      return NextResponse.json(
        { message: "Missing authorization code or user ID." },
        { status: 400 }
      );
    }

    // 🛑 Step 1: Exchange authorization code for access token
    const response = await fetch(HUBSPOT_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: HUBSPOT_CLIENT_ID || "",
        client_secret: HUBSPOT_CLIENT_SECRET || "",
        redirect_uri: HUBSPOT_REDIRECT_URI,
        code: code,
      }),
    });

    const tokenData = await response.json();
    if (!response.ok) {
      console.error("HubSpot OAuth Error:", tokenData);
      return NextResponse.json(
        { message: "Failed to exchange code for token", error: tokenData },
        { status: 400 }
      );
    }

    const { access_token, refresh_token, expires_in } = tokenData;
    const expiryTime = new Date(Date.now() + expires_in * 1000)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    console.log("✅ HubSpot Access Token:", access_token);
    console.log("✅ HubSpot Refresh Token:", refresh_token);

    // 🛑 Step 2: Fetch HubSpot Account Details (Get `portalId`)
    const userInfoResponse = await fetch(HUBSPOT_USER_INFO_URL + access_token, {
      method: "GET",
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const userInfo = await userInfoResponse.json();
    if (!userInfoResponse.ok) {
      console.error("Failed to fetch HubSpot account info:", userInfo);
      return NextResponse.json(
        { message: "Failed to retrieve HubSpot account details", error: userInfo },
        { status: 400 }
      );
    }

    // 🛑 Extract HubSpot `portalId` (HubSpot Account ID)
    const hubspotPortalId = userInfo.hub_id;
    console.log("✅ HubSpot Account ID (portalId):", hubspotPortalId);

    // Save OAuth details in DB
    return await upsertUserHubSpotData(userId, hubspotPortalId, access_token, refresh_token, expiryTime);
  } catch (error:any) {
    console.error("Error in HubSpot OAuth:", error.message);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// Function to upsert HubSpot user data into the database
// async function upsertUserHubSpotData(userId, hubspotPortalId, access_token, refresh_token, expiryTime) {
//   let connection;
//   try {
//     connection = await pool.getConnection();
//     await connection.beginTransaction();

//     // Upsert user_oauth table
//     await connection.query(
//       `INSERT INTO user_oauth (user_id, hubspot_acc, created_at, updated_at) 
//        VALUES (?, ?, NOW(), NOW()) 
//        ON DUPLICATE KEY UPDATE 
//        hubspot_acc = VALUES(hubspot_acc), updated_at = NOW()`,
//       [userId, hubspotPortalId]
//     );
//     console.log(`✅ Upserted user_oauth for user_id: ${userId}`);

//     // Upsert user_hubspot_data table
//     await connection.query(
//       `INSERT INTO user_hubspot_data (user_id, hubspot_access_token, hubspot_refresh_token, created_at, updated_at, hubspot_expiry_time) 
//        VALUES (?, ?, ?, NOW(), NOW(), ?) 
//        ON DUPLICATE KEY UPDATE 
//        hubspot_access_token = VALUES(hubspot_access_token), 
//        hubspot_refresh_token = VALUES(hubspot_refresh_token), 
//        hubspot_expiry_time = VALUES(hubspot_expiry_time), 
//        updated_at = NOW()`,
//       [userId, access_token, refresh_token, expiryTime]
//     );
//     console.log(`✅ Upserted user_hubspot_data for user_id: ${userId}`);

//     // Call function to create HubSpot properties
//     createusuagebasedHubSpotProperties(access_token);

//     await connection.commit();
//     return NextResponse.json(
//       { message: "HubSpot OAuth completed successfully", hubspotPortalId, ...successObj },
//       { status: 200 }
//     );
//   } catch (error:any) {
//     if (connection) await connection.rollback();
//     console.error("❌ Transaction failed, rolled back changes:", error);
//     return NextResponse.json(
//       { message: "Database transaction failed", error: error.message },
//       { status: 500 }
//     );
//   } finally {
//     if (connection) connection.release();
//   }
// }


async function upsertUserHubSpotData(userId, hubspotPortalId, access_token, refresh_token, expiryTime) {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 🛑 Step 1: Attempt to UPDATE existing user_oauth record for HubSpot
    const [updateOauthResult] = await connection.query(
      `UPDATE user_oauth 
       SET hubspot_acc = ?, updated_at = NOW() 
       WHERE user_id = ?`,
      [hubspotPortalId, userId]
    );

    if (updateOauthResult.affectedRows === 0) {
      // If no rows were updated, INSERT a new record
      await connection.query(
        `INSERT INTO user_oauth (user_id, hubspot_acc, created_at, updated_at) 
         VALUES (?, ?, NOW(), NOW())`,
        [userId, hubspotPortalId]
      );
      console.log(`✅ Inserted new user_oauth for HubSpot user_id: ${userId}`);
    } else {
      console.log(`✅ Updated user_oauth for HubSpot user_id: ${userId}`);
    }

    // 🛑 Step 2: Attempt to UPDATE existing user_hubspot_data record
    const [updateHubspotDataResult] = await connection.query(
      `UPDATE user_hubspot_data 
       SET hubspot_access_token = ?, hubspot_refresh_token = ?, hubspot_expiry_time = ?, updated_at = NOW() 
       WHERE user_id = ?`,
      [access_token, refresh_token, expiryTime, userId]
    );

    if (updateHubspotDataResult.affectedRows === 0) {
      // If no rows were updated, INSERT a new record
      await connection.query(
        `INSERT INTO user_hubspot_data (user_id, hubspot_access_token, hubspot_refresh_token, created_at, updated_at, hubspot_expiry_time) 
         VALUES (?, ?, ?, NOW(), NOW(), ?)`,
        [userId, access_token, refresh_token, expiryTime]
      );
      console.log(`✅ Inserted new user_hubspot_data for user_id: ${userId}`);
    } else {
      console.log(`✅ Updated user_hubspot_data for user_id: ${userId}`);
    }

    await connection.commit();
    return NextResponse.json(
      { message: "HubSpot OAuth completed successfully", hubspotPortalId, ...successObj },
      { status: 200 }
    );

  } catch (error:any) {
    if (connection) await connection.rollback();
    console.error("❌ Transaction failed, rolled back changes:", error);
    return NextResponse.json(
      { message: "Database transaction failed", error: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
