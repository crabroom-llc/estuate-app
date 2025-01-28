import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import privateRoute from '@/utils/privateRoute';

// Stripe API endpoint and credentials
const STRIPE_API_URL = "https://api.stripe.com/v1";
const STRIPE_CLIENT_ID = process.env.STRIPE_CLIENT_ID;
const STRIPE_CLIENT_SECRET = process.env.STRIPE_CLIENT_SECRET;

// Middleware to validate JWT token
async function validateToken(request: Request) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new Error("Missing or invalid Authorization header");
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

        // Return decoded token if valid
        return decoded;
    } catch (error: any) {
        if (error.name === "JsonWebTokenError") {
            throw new Error("Invalid token");
        } else if (error.name === "TokenExpiredError") {
            throw new Error("Token has expired");
        } else {
            throw new Error("Unauthorized: Invalid or expired token");
        }
    }
}

export async function POST(request: Request) {
    try {
        // Validate the JWT token
        const userData = await privateRoute(request);

        // Parse the request body to get the refresh token and customer data
        const { refresh_token, customerData } = await request.json();

        if (!refresh_token) {
            return NextResponse.json(
                { message: "Refresh token is missing" },
                { status: 400 }
            );
        }

        if (!customerData) {
            return NextResponse.json(
                { message: "Customer data is missing" },
                { status: 400 }
            );
        }

        // Use the refresh token to obtain a new access token
        const tokenResponse = await fetch(`${STRIPE_API_URL}/oauth/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: STRIPE_CLIENT_ID as string,
                client_secret: STRIPE_CLIENT_SECRET as string,
                grant_type: "refresh_token",
                refresh_token: refresh_token,
            }),
        });

        const tokenData = await tokenResponse.json();
        console.log(tokenData);
        if (!tokenResponse.ok) {
            return NextResponse.json(
                {
                    message: "Failed to refresh access token",
                    error: tokenData,
                },
                { status: 400 }
            );
        }

        const access_token = tokenData.access_token;

        // Use the access token to create a customer in Stripe
        const customerResponse = await fetch(`${STRIPE_API_URL}/customers`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${access_token}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams(customerData), // Ensure customerData is properly formatted
        });

        const customer = await customerResponse.json();

        if (!customerResponse.ok) {
            return NextResponse.json(
                {
                    message: "Failed to create Stripe customer",
                    error: customer,
                },
                { status: 400 }
            );
        }

        // Return the created customer
        return NextResponse.json(
            {
                message: "Customer created successfully",
                customer,
                // user: userData,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Error:", error.message);

        // Handle specific error cases
        if (error.message === "Invalid token") {
            return NextResponse.json(
                { message: "The token provided is invalid" },
                { status: 401 }
            );
        } else if (error.message === "Token has expired") {
            return NextResponse.json(
                { message: "The token has expired. Please log in again." },
                { status: 401 }
            );
        } else if (error.message === "Unauthorized: Invalid or expired token") {
            return NextResponse.json(
                { message: "Unauthorized: Invalid or expired token" },
                { status: 401 }
            );
        } else {
            return NextResponse.json(
                {
                    message: "Internal server error",
                    error: error.message,
                },
                { status: 500 }
            );
        }
    }
}
