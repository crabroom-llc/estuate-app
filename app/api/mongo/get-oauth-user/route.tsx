import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { query } from "@/utils/mysql";
import { errorObj, successObj } from "@/utils/responseObj";
import privateRoute from "@/utils/privateRoute";

export async function GET(request: Request) {
    try {
        const data = request;

        const userData = await privateRoute(request);

        if (userData instanceof NextResponse) {
            return userData;
        }

        const result = {
            isStripeConnected: false,
            isHubspotConnected: false
        };

        // get all details of user from user_oauth table using user_id
        const userOAuthData = await query("SELECT * FROM user_oauth WHERE user_id = ?", [userData.id]);

        if (userOAuthData.length === 0) {
            return NextResponse.json({ message: "No user found", data: result, ...successObj }, { status: 200 });
        }

        // check if user has stripe and hubspot account or not
        const userStripeAcc = userOAuthData[0].stripe_acc;
        if (userStripeAcc) {
            result.isStripeConnected = true;
        }
        const userHubspotAcc = userOAuthData[0].hubspot_acc;
        if (userHubspotAcc) {
            result.isHubspotConnected = true;
        }
        return NextResponse.json({ message: "User registered successfully", data: result, ...successObj }, { status: 201 });
    } catch (error: any) {
        console.error("Error getting user:", error);
        return NextResponse.json({ message: "Internal Server Error", ...errorObj }, { status: 500 });
    }
}
