import { NextResponse } from "next/server";
import privateRoute from "@/utils/privateRoute";
import { query } from "@/utils/mysql";
import { successObj } from "@/utils/responseObj";

export async function POST(request: Request) {
    try {
        // Validate the JWT token
        const userData = await privateRoute(request);

        const data = await request.json();

        // Update the user's payment method in the database using the user_id
        const [rows] = await query(
            `SELECT * FROM user_hubspot_data WHERE user_id = ?`,
            [userData.id]
        );

        // update the user's payment method in the database using the user_id
        const updateRows = await query(
            `UPDATE user_hubspot_data SET save_payment_method = ? WHERE user_id = ?`,
            [data.save_payment_method, userData.id]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { message: "No user found", ...successObj },
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
