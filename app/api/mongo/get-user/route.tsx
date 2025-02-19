import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { errorObj, successObj } from "@/utils/responseObj";
import privateRoute from "@/utils/privateRoute";
import { pool } from "@/utils/mysql";

export async function GET(request: Request) {
    try {
        // 🛑 Validate the JWT token
        const userData = await privateRoute(request);

        if (userData instanceof NextResponse) {
            return userData;
        }

        userData.password = undefined;

        return NextResponse.json(
            { message: "Access token retrieved successfully", data: userData, ...successObj },
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