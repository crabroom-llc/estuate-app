import { NextResponse } from "next/server";
import user from '@/mongodb/models/UserModel';
import bcrypt from 'bcrypt';
import connectToDatabase from "@/utils/mongodb";
import { successObj, errorObj } from "@/utils/responseObj";
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // connect to the database
        await connectToDatabase();

        // check if the user already exists
        const userExists = await user.findOne({ email: data.email });
        if (!userExists) {
            return NextResponse.json({ message: 'Wrong Credentials', ...errorObj }, { status: 400 });
        }

        // check the password
        const passwordMatch = await bcrypt.compare(data.password, userExists.password);
        if (!passwordMatch) {
            return NextResponse.json({ message: 'Wrong Credentials', ...errorObj }, { status: 400 });
        }

        // create a token
        const token = jwt.sign({ email: userExists.email }, process.env.JWT_SECRET, { expiresIn: '1d' });

        // save the token
        userExists.token = token;
        userExists.lastLogin = new Date();
        await userExists.save();

        // remove the password from the response
        userExists.password = undefined;

        // return the response
        return NextResponse.json({ message: 'User logged in successfully', data: userExists, ...successObj }, { status: 200 });
    } catch (error: any) {
        console.log(error);
        return NextResponse.json({ message: error.message, ...errorObj }, { status: 400 });
    }
}