import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { query } from "@/utils/mysql";
import jwt from "jsonwebtoken";
import { errorObj, successObj } from "@/utils/responseObj";

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // Check if the user exists
        const users = await query("SELECT * FROM users WHERE email = ?", [data.email]) as any[];
        if (users.length === 0) {
            return NextResponse.json({ message: "Invalid email or password", ...errorObj }, { status: 400 });
        }

        const user = users[0];

        // Validate the password
        const isPasswordValid = await bcrypt.compare(data.password, user.password);
        if (!isPasswordValid) {
            return NextResponse.json({ message: "Invalid email or password", ...errorObj }, { status: 400 });
        }

        // Generate a JWT token
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: "1d" });

        const userLogin = await query("Select * from user_login where user_id = ?", [user.id]) as any[];
        if (userLogin.length === 0) {
            await query("INSERT INTO user_login (user_id, token, last_login) VALUES (?, ?, ?)", [user.id, token, new Date()]);
        } else {
            await query("UPDATE user_login SET token = ?, expired_token = ?, last_login = ? WHERE user_id = ?", [token, userLogin[0].token, new Date(), user.id]);
        }
        user.password = undefined;

        // Respond with success
        return NextResponse.json({
            message: "Login successful",
            ...successObj,
            data: {
                ...user,
                token: token,
            }
        });
    } catch (error: any) {
        console.error("Error during login:", error);
        return NextResponse.json({ message: "Internal Server Error", ...errorObj }, { status: 500 });
    }
}
