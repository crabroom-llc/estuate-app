import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { query } from "@/utils/mysql";
import { errorObj, successObj } from "@/utils/responseObj";

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // Check if the user already exists
        const existingUser = await query("SELECT * FROM users WHERE email = ?", [data.email]);
        if (Array.isArray(existingUser) && existingUser.length > 0) {
            return NextResponse.json({ message: "User already exists", ...errorObj }, { status: 400 });
        }

        // Validate the password (optional)
        // const passwordRegex = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
        // if (!passwordRegex.test(data.password)) {
        //     return NextResponse.json(
        //         { message: "Password must contain at least one number, one uppercase letter, one lowercase letter, one special character and must be at least 8 characters long" },
        //         { status: 400 }
        //     );
        // }

        // Hash the password
        const hashedPassword = await bcrypt.hash(data.password, 12);

        // Insert the new user into the database
        await query("INSERT INTO users (firstName, lastName, email, password) VALUES (?, ?, ?, ?)", [data.firstName, data.lastName, data.email, hashedPassword]);

        // Respond with success
        return NextResponse.json({ message: "User registered successfully", ...successObj }, { status: 201 });
    } catch (error: any) {
        console.error("Error registering user:", error);
        return NextResponse.json({ message: "Internal Server Error", ...errorObj }, { status: 500 });
    }
}
