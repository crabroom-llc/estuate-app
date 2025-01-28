import { NextResponse } from "next/server";
import jwt from 'jsonwebtoken';
import { errorObj, successObj } from "@/utils/responseObj";

// Replace with your actual Stripe client credentials
const STRIPE_CLIENT_ID = process.env.STRIPE_CLIENT_ID;
const STRIPE_REDIRECT_URI = process.env.STRIPE_REDIRECT_URI ||  'http://localhost:3000';
const STRIPE_CLIENT_SECRET = process.env.STRIPE_CLIENT_SECRET;
// Stripe token endpoint
const STRIPE_TOKEN_URL = "https://connect.stripe.com/oauth/token";
// Middleware to validate JWT token
async function validateToken(request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // Missing or improperly formatted Authorization header
            throw new Error('Missing or invalid Authorization header');
        }

        const token = authHeader.split(' ')[1]; // Extract token from "Bearer <token>"
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token with secret
        // console.log(decoded);
        // Return decoded token data if valid
        return decoded;
    } catch (error :any) {
        // Throw an appropriate error for invalid/expired tokens
        if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid token');
        } else if (error.name === 'TokenExpiredError') {
            throw new Error('Token has expired');
        } else {
            throw new Error('Unauthorized: Invalid or expired token');
        }
    }
}

export async function GET(request) {
    try {
        // Validate the JWT token
        // const userData = await validateToken(request);
        // console.log(userData);
        // Generate the Stripe OAuth URL
        const stripeOauthUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${STRIPE_CLIENT_ID}&scope=read_write&redirect_uri=${encodeURIComponent(STRIPE_REDIRECT_URI)}`;
        console.log("sending the code", stripeOauthUrl);
        // Send the Stripe OAuth URL as a response
        return NextResponse.json(
            { message: 'Stripe OAuth URL generated successfully', url:stripeOauthUrl },
        );
    } catch (error : any) {
        console.error(error.message); // Log error for debugging

        // Handle specific error cases for better clarity
        if (error.message === 'Missing or invalid Authorization header') {
            return NextResponse.json(
                { message: 'Authorization header is missing or invalid', ...errorObj },
                { status: 400 }
            );
        } else if (error.message === 'Invalid token') {
            return NextResponse.json(
                { message: 'The token provided is invalid', ...errorObj },
                { status: 401 }
            );
        } else if (error.message === 'Token has expired') {
            return NextResponse.json(
                { message: 'The token has expired. Please log in again.', ...errorObj },
                { status: 401 }
            );
        }

        // Default fallback for unexpected errors
        return NextResponse.json(
            { message: 'Unauthorized: Invalid or expired token', ...errorObj },
            { status: 401 }
        );
    }
}

export async function POST(request: Request) {
    try {
        // Validate the JWT token
        // const userData = await validateToken(request);

        // Parse the authorization code from the request body
        const { code, userId } = await request.json();
        console.log(code);
        if (!code) {
            console.log("code is missing");
            return NextResponse.json({ message: "Authorization code is missing." }, { status: 400 });
        }

        // Exchange the authorization code for an access token
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

        const data = await response.json();
        console.log(data);
        if (!response.ok) {
            console.log(data);
            return NextResponse.json(
                { message: "Failed to exchange code for token", ...errorObj },
                { status: 400 }
            );
        }
        const access_token = data.access_token;
        const refresh_token = data.refresh_token;
        const stripe_user_id = data.stripe_user_id;
        console.log(userId);

        // "Insert into user_oauthdeails Values(access_token,refresh_token,stripe_user_id,userId)";
        // Send the access token and other details back
        return NextResponse.json(
            { message: "Access token retrieved successfully", ...successObj, response:data },
            
        );
    } catch (error: any) {
        console.error("Error exchanging authorization code:", error.message);

        // Return appropriate error responses based on the error
        if (error.message === "Invalid token") {
            return NextResponse.json({ message: "The token provided is invalid" }, { status: 401 });
        } else if (error.message === "Token has expired") {
            return NextResponse.json({ message: "The token has expired. Please log in again." }, { status: 401 });
        } else if (error.message === "Unauthorized: Invalid or expired token") {
            return NextResponse.json({ message: "Unauthorized: Invalid or expired token" }, { status: 401 });
        } else {
            return NextResponse.json(
                { message: "Internal server error", error: error.message },
                { status: 500 }
            );
        }
    }
}

// rt_Re86D0qJTlI2m4ydfDlw9Bdafeaua443JooUDolYA1NYBjo5