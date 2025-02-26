import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { errorObj, successObj } from "@/utils/responseObj";
import privateRoute from "@/utils/privateRoute";
import { pool } from "@/utils/mysql";

// Replace with your actual Stripe client credentials
const STRIPE_CLIENT_ID = process.env.STRIPE_CLIENT_ID;
const STRIPE_REDIRECT_URI = process.env.STRIPE_REDIRECT_URI || "http://localhost:3000";
const STRIPE_CLIENT_SECRET = process.env.STRIPE_CLIENT_SECRET;
const STRIPE_TOKEN_URL = process.env.STRIPE_TOKEN_URL || "https://connect.stripe.com/oauth/token";

// Middleware to validate JWT token
async function validateToken(request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Missing or invalid Authorization header");
    }

    const token = authHeader.split(" ")[1];
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error:any) {
    throw new Error(error.name === "TokenExpiredError" ? "Token has expired" : "Invalid or expired token");
  }
}

// Generate Stripe OAuth URL
export async function GET(request) {
  try {
    const userData = await privateRoute(request);
    console.log(userData);

    const stripeOauthUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${STRIPE_CLIENT_ID}&scope=read_write&redirect_uri=${encodeURIComponent(
      STRIPE_REDIRECT_URI
    )}`;

    console.log("Sending OAuth URL:", stripeOauthUrl);
    return NextResponse.json({ message: "Stripe OAuth URL generated successfully", url: stripeOauthUrl });
  } catch (error:any) {
    console.error("Error in GET:", error.message);
    return NextResponse.json({ message: error.message, ...errorObj }, { status: 401 });
  }
}

// Handle Stripe OAuth token exchange and save data to DB
export async function POST(request) {
  try {
    const userData = await privateRoute(request);
    if (userData instanceof NextResponse) return userData;

    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      console.error("Invalid JSON input:", error);
      return NextResponse.json({ message: "Invalid or missing JSON in request body" }, { status: 400 });
    }

    const { code, userId } = requestBody || {};
    if (!code || !userId) {
      console.log("Missing required fields");
      return NextResponse.json({ message: "Missing authorization code or user ID." }, { status: 400 });
    }

    console.log("Received code:", code);
    console.log("User ID:", userId);

    // Exchange authorization code for access token
    const stripeResponse = await fetch(STRIPE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: STRIPE_CLIENT_ID || "",
        client_secret: STRIPE_CLIENT_SECRET || "",
        code,
        grant_type: "authorization_code",
      }),
    });

    const data = await stripeResponse.json();
    if (!stripeResponse.ok) {
      console.error("Stripe API Error:", data);
      return NextResponse.json({ message: "Failed to exchange code for token", error: data }, { status: 400 });
    }

    const { access_token, refresh_token, stripe_user_id } = data;
    const expiry_time = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace("T", " ");

    // Save data to DB using UPSERT (Insert or Update)
    return await upsertUserStripeData(userId, stripe_user_id, access_token, refresh_token, expiry_time);
  } catch (error:any) {
    console.error("Error exchanging authorization code:", error.message);
    return NextResponse.json({ message: error.message.includes("Unauthorized") ? "Unauthorized: Invalid or expired token" : "Internal server error", error: error.message }, { status: 500 });
  }
}

// Function to upsert user data into the database
// async function upsertUserStripeData(userId, stripe_user_id, access_token, refresh_token, expiry_time) {
//   let connection;
//   try {
//     connection = await pool.getConnection();
//     await connection.beginTransaction();

//     // Upsert user_oauth table
//     await connection.query(
//       `INSERT INTO user_oauth (user_id, stripe_acc, created_at, updated_at) 
//        VALUES (?, ?, NOW(), NOW()) 
//        ON DUPLICATE KEY UPDATE 
//        stripe_acc = VALUES(stripe_acc), updated_at = NOW()`,
//       [userId, stripe_user_id]
//     );
//     console.log(`✅ Upserted user_oauth for user_id: ${userId}`);

//     // Upsert user_stripe_data table
//     await connection.query(
//       `INSERT INTO user_stripe_data (user_id, stripe_access_token, stripe_refresh_token, created_at, updated_at, stripe_expiry_time) 
//        VALUES (?, ?, ?, NOW(), NOW(), ?) 
//        ON DUPLICATE KEY UPDATE 
//        stripe_access_token = VALUES(stripe_access_token), 
//        stripe_refresh_token = VALUES(stripe_refresh_token), 
//        stripe_expiry_time = VALUES(stripe_expiry_time), 
//        updated_at = NOW()`,
//       [userId, access_token, refresh_token, expiry_time]
//     );
//     console.log(`✅ Upserted user_stripe_data for user_id: ${userId}`);

//     await connection.commit();
//     return NextResponse.json({ message: "User data successfully upserted", ...successObj }, { status: 200 });

//   } catch (error:any) {
//     if (connection) await connection.rollback();
//     console.error("❌ Transaction failed, rolled back changes:", error);
//     return NextResponse.json({ message: "Database transaction failed", error: error.message }, { status: 500 });

//   } finally {
//     if (connection) connection.release();
//   }
// }


async function upsertUserStripeData(userId, stripe_user_id, access_token, refresh_token, expiry_time) {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 🛑 Step 1: Attempt to UPDATE existing user_oauth record for Stripe
    const [updateOauthResult] = await connection.query(
      `UPDATE user_oauth 
       SET stripe_acc = ?, updated_at = NOW() 
       WHERE user_id = ?`,
      [stripe_user_id, userId]
    );

    if (updateOauthResult.affectedRows === 0) {
      // If no rows were updated, INSERT a new record
      await connection.query(
        `INSERT INTO user_oauth (user_id, stripe_acc, created_at, updated_at) 
         VALUES (?, ?, NOW(), NOW())`,
        [userId, stripe_user_id]
      );
      console.log(`✅ Inserted new user_oauth for Stripe user_id: ${userId}`);
    } else {
      console.log(`✅ Updated user_oauth for Stripe user_id: ${userId}`);
    }

    // 🛑 Step 2: Attempt to UPDATE existing user_stripe_data record
    const [updateStripeDataResult] = await connection.query(
      `UPDATE user_stripe_data 
       SET stripe_access_token = ?, stripe_refresh_token = ?, stripe_expiry_time = ?, updated_at = NOW() 
       WHERE user_id = ?`,
      [access_token, refresh_token, expiry_time, userId]
    );

    if (updateStripeDataResult.affectedRows === 0) {
      // If no rows were updated, INSERT a new record
      await connection.query(
        `INSERT INTO user_stripe_data (user_id, stripe_access_token, stripe_refresh_token, created_at, updated_at, stripe_expiry_time) 
         VALUES (?, ?, ?, NOW(), NOW(), ?)`,
        [userId, access_token, refresh_token, expiry_time]
      );
      console.log(`✅ Inserted new user_stripe_data for user_id: ${userId}`);
    } else {
      console.log(`✅ Updated user_stripe_data for user_id: ${userId}`);
    }

    await connection.commit();
    return NextResponse.json(
      { message: "Stripe OAuth completed successfully", ...successObj },
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


