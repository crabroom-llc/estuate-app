import { NextResponse } from "next/server";
import privateRoute from "@/utils/privateRoute";
import { pool } from "@/utils/mysql";

const HUBSPOT_CLIENT_ID = process.env.HUBSPOT_CLIENT_ID;
const HUBSPOT_REDIRECT_URI = process.env.HUBSPOT_REDIRECT_URI as string;
const HUBSPOT_AUTH_URL = process.env.HUBSPOT_AUTH_URL;
const HUBSPOT_SCOPE = process.env.HUBSPOT_SCOPE;
const HUBSPOT_CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET;
const HUBSPOT_TOKEN_URL = process.env.HUBSPOT_TOKEN_URL as string;
const HUBSPOT_USER_INFO_URL = "https://api.hubapi.com/oauth/v1/access-tokens/";

export async function GET(request: Request) {
  try {
    // Validate the JWT token
    const userData = await privateRoute(request);

    // Generate the HubSpot OAuth URL
    const hubspotOauthUrl = `${HUBSPOT_AUTH_URL}?client_id=${HUBSPOT_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      HUBSPOT_REDIRECT_URI
    )}&scope=${HUBSPOT_SCOPE}&response_type=code`;

    console.log("HubSpot OAuth URL:", hubspotOauthUrl);

    return NextResponse.json({
      message: "HubSpot OAuth URL generated successfully",
      url: hubspotOauthUrl,
    });
  } catch (error: any) {
    console.error(error.message);
    return NextResponse.json(
      { message: "Unauthorized: Invalid or expired token" },
      { status: 401 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { code, userId } = await request.json();
    console.log("USer id here"+userId)
    if (!code || !userId || userId == 0) {
      console.log(userId);
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
        client_id: process.env.HUBSPOT_CLIENT_ID as string,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET as string,
        redirect_uri: process.env.HUBSPOT_REDIRECT_URI as string,
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

    const { access_token, refresh_token } = tokenData;
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
        {
          message: "Failed to retrieve HubSpot account details",
          error: userInfo,
        },
        { status: 400 }
      );
    }

    // 🛑 Extract HubSpot `portalId` (HubSpot Account ID)
    const hubspotPortalId = userInfo.hub_id; // This is the HubSpot account ID

    console.log("✅ HubSpot Account ID (portalId):", hubspotPortalId);

    // 🛑 Step 3: Insert or Update HubSpot OAuth Data
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // Check if the user already exists in `user_hubspot_data`
      const [existingUser] = await connection.query(
        "SELECT id FROM user_oauth WHERE user_id = ?",
        [userId]
      );
      console.log("user id length "+existingUser.length);
      if (existingUser.length > 0) {
        // 🛑 Step 4: If user exists, update their HubSpot data
        // await connection.query(
        //   "UPDATE user_hubspot_data SET hubspot_access_token = ?, hubspot_refresh_token = ?, updated_at = NOW() WHERE user_id = ?",
        //   [access_token, refresh_token,  userId]
        // );
        
        await connection.query(
          "INSERT INTO user_hubspot_data (user_id, hubspot_access_token, hubspot_refresh_token, created_at, updated_at) VALUES ( ?, ?, ?, NOW(), NOW())",
          [userId, access_token, refresh_token ]
        );
        console.log("updated user_hubspot_data");
        await connection.query(
          "UPDATE user_oauth SET hubspot_acc = ?, updated_at = NOW() WHERE user_id = ?",
          [hubspotPortalId, userId]
        );
      } else {
        // 🛑 Step 5: If user does NOT exist, insert a new record
        await connection.query(
          "INSERT INTO user_oauth (user_id, hubspot_acc, created_at, updated_at) VALUES (?, ?, NOW(), NOW())",
          [userId, hubspotPortalId]
        );

        await connection.query(
          "INSERT INTO user_hubspot_data (user_id, hubspot_access_token, hubspot_refresh_token, created_at, updated_at) VALUES ( ?, ?, ?, NOW(), NOW())",
          [userId, access_token, refresh_token ]
        );
      }

      await connection.commit();
      connection.release();
    } catch (error) {
      await connection.rollback();
      connection.release();
      console.error("Transaction failed:", error);
      return NextResponse.json(
        { message: "Database transaction failed" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "HubSpot OAuth completed successfully", hubspotPortalId },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in HubSpot OAuth:", error.message);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
