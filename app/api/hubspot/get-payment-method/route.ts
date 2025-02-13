import { NextResponse } from "next/server";
import privateRoute from "@/utils/privateRoute";
import { query } from "@/utils/mysql";
import { successObj } from "@/utils/responseObj";

export async function GET(request: Request) {
    try {
        // Validate the JWT token
        const userData = await privateRoute(request);

        if (userData instanceof NextResponse) {
            return userData;
        }

        // Get record from user_hubspot_data table using user_id
        const rows = await query(
            `SELECT * FROM user_hubspot_data WHERE user_id = ?`,
            [userData.id]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { message: "No user found", data: [], ...successObj },
                { status: 200 }
            );
        }

        return NextResponse.json(
            {
                message: "User found",
                data: rows[0],
                ...successObj
            },
            { status: 200 }
        );

    } catch (error: any) {
        console.error(error.message);
        return NextResponse.json(
            { message: "Unauthorized: Invalid or expired token" },
            { status: 401 }
        );
    }
}
