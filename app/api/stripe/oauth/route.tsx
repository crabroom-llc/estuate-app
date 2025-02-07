import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { errorObj, successObj } from "@/utils/responseObj";
import privateRoute from "@/utils/privateRoute";
import { pool } from "@/utils/mysql";

// Replace with your actual Stripe client credentials
const STRIPE_CLIENT_ID = process.env.STRIPE_CLIENT_ID;
const STRIPE_REDIRECT_URI =
  process.env.STRIPE_REDIRECT_URI || "http://localhost:3000";
const STRIPE_CLIENT_SECRET = process.env.STRIPE_CLIENT_SECRET;
// Stripe token endpoint
const STRIPE_TOKEN_URL =
  process.env.STRIPE_TOKEN_URL || "https://connect.stripe.com/oauth/token";
// Middleware to validate JWT token
async function validateToken(request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // Missing or improperly formatted Authorization header
      throw new Error("Missing or invalid Authorization header");
    }

    const token = authHeader.split(" ")[1]; // Extract token from "Bearer <token>"
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token with secret
    // console.log(decoded);
    // Return decoded token data if valid
    return decoded;
  } catch (error: any) {
    // Throw an appropriate error for invalid/expired tokens
    if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid token");
    } else if (error.name === "TokenExpiredError") {
      throw new Error("Token has expired");
    } else {
      throw new Error("Unauthorized: Invalid or expired token");
    }
  }
}

export async function GET(request) {
  try {
    // Validate the JWT token
    const userData = await privateRoute(request);
    console.log(userData);
    // Generate the Stripe OAuth URL
    const stripeOauthUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${STRIPE_CLIENT_ID}&scope=read_write&redirect_uri=${encodeURIComponent(
      STRIPE_REDIRECT_URI
    )}`;
    console.log("sending the code", stripeOauthUrl);
    // Send the Stripe OAuth URL as a response
    return NextResponse.json({
      message: "Stripe OAuth URL generated successfully",
      url: stripeOauthUrl,
    });
  } catch (error: any) {
    console.error(error.message); // Log error for debugging

    // Handle specific error cases for better clarity
    if (error.message === "Missing or invalid Authorization header") {
      return NextResponse.json(
        { message: "Authorization header is missing or invalid", ...errorObj },
        { status: 400 }
      );
    } else if (error.message === "Invalid token") {
      return NextResponse.json(
        { message: "The token provided is invalid", ...errorObj },
        { status: 401 }
      );
    } else if (error.message === "Token has expired") {
      return NextResponse.json(
        { message: "The token has expired. Please log in again.", ...errorObj },
        { status: 401 }
      );
    }

    // Default fallback for unexpected errors
    return NextResponse.json(
      { message: "Unauthorized: Invalid or expired token", ...errorObj },
      { status: 401 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // 🛑 Validate the JWT token
    const userData = await privateRoute(request);

    // 🛑 If privateRoute returns a NextResponse (Unauthorized), return it immediately
    if (userData instanceof NextResponse) {
      return userData;
    }

    // 🛑 Ensure request body exists before parsing
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      console.error("Invalid JSON input:", error);
      return NextResponse.json(
        { message: "Invalid or missing JSON in request body" },
        { status: 400 }
      );
    }

    // 🛑 Extract required fields
    const { code, userId } = requestBody || {};

    // 🛑 Validate required fields
    if (!code || !userId) {
      console.log("Missing required fields");
      return NextResponse.json(
        { message: "Missing authorization code or user ID." },
        { status: 400 }
      );
    }

    console.log("code:", code);
    console.log("userId:", userId);

    // 🛑 Exchange the authorization code for an access token
    const response = await fetch(STRIPE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: STRIPE_CLIENT_ID as string,
        client_secret: STRIPE_CLIENT_SECRET as string,
        code: code,
        grant_type: "authorization_code",
      }),
    });

    // 🛑 Parse response JSON safely
    let data;
    try {
      data = await response.json();
    } catch (error) {
      console.error("Failed to parse Stripe response:", error);
      return NextResponse.json(
        { message: "Invalid response from Stripe" },
        { status: 500 }
      );
    }

    // 🛑 Handle Stripe API errors
    if (!response.ok) {
      console.error("Stripe API Error:", data);
      return NextResponse.json(
        { message: "Failed to exchange code for token", error: data },
        { status: 400 }
      );
    }

    const { access_token, refresh_token, stripe_user_id } = data;

    // 🛑 Insert into the database
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // 🛑 Step 1: Check if `user_id` exists in `user_oauth`
      const [existingOauth] = await connection.query(
        "SELECT id FROM user_oauth WHERE user_id = ?",
        [userId]
      );

      if (existingOauth.length > 0) {
        // 🛑 Step 2: If user_id exists, UPDATE the existing record
        await connection.query(
          "UPDATE user_oauth SET stripe_acc = ?, updated_at = NOW() WHERE user_id = ?",
          [stripe_user_id, userId]
        );
        console.log(`✅ Updated user_oauth for user_id: ${userId}`);
      } else {
        // 🛑 Step 3: If user_id does NOT exist, INSERT a new record
        await connection.query(
          "INSERT INTO user_oauth (user_id, stripe_acc, created_at, updated_at) VALUES (?, ?, NOW(), NOW())",
          [userId, stripe_user_id]
        );
        console.log(
          `✅ Inserted new record in user_oauth for user_id: ${userId}`
        );
      }

      // 🛑 Step 4: Check if `user_id` exists in `user_stripe_data`
      const [existingStripe] = await connection.query(
        "SELECT id FROM user_stripe_data WHERE user_id = ?",
        [userId]
      );

      if (existingStripe.length > 0) {
        // 🛑 Step 5: If user_id exists, UPDATE the existing record
        await connection.query(
          "UPDATE user_stripe_data SET stripe_access_token = ?, stripe_refresh_token = ?, updated_at = NOW() WHERE user_id = ?",
          [access_token, refresh_token, userId]
        );
        console.log(`✅ Updated user_stripe_data for user_id: ${userId}`);
      } else {
        // 🛑 Step 6: If user_id does NOT exist, INSERT a new record
        await connection.query(
          "INSERT INTO user_stripe_data (user_id, stripe_access_token, stripe_refresh_token, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())",
          [userId, access_token, refresh_token]
        );
        console.log(
          `✅ Inserted new record in user_stripe_data for user_id: ${userId}`
        );
      }

      await connection.commit();
      connection.release();
    } catch (error) {
      await connection.rollback();
      connection.release();
      console.error("❌ Transaction failed, rolled back changes:", error);
      return NextResponse.json(
        { message: "Database transaction failed" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Access token retrieved successfully", response: data, ...successObj },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error exchanging authorization code:", error.message);

    // 🛑 Handle token errors properly
    if (
      error.message === "Invalid token" ||
      error.message === "Token has expired" ||
      error.message.includes("Unauthorized")
    ) {
      return NextResponse.json(
        { message: "Unauthorized: Invalid or expired token" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

// rt_Re86D0qJTlI2m4ydfDlw9Bdafeaua443JooUDolYA1NYBjo5
