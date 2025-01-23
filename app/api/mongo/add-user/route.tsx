import { NextResponse } from "next/server";
import user from '@/mongodb/models/UserModel';
import bcrypt from 'bcrypt';
import _ from 'lodash'
import connectToDatabase from "@/utils/mongodb";
import { successObj, errorObj } from "@/utils/responseObj";

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // connect to the database
        await connectToDatabase();

        // check if the user already exists
        const userExists = await user.findOne({ email: data.email });
        if (userExists) {
            return NextResponse.json({ message: 'User already exists', ...errorObj }, { status: 400 });
        }

        // create a new user
        const newUser = new user();
        _.each(data, (value: any, key: string | number) => {
            newUser[key] = value;
        });

        // check the password
        // const passwordRegex = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
        // if (!passwordRegex.test(data.password)) {
        //     return NextResponse.json({ message: 'Password must contain at least one number, one uppercase letter, one lowercase letter, one special character and must be at least 8 characters long', ...errorObj }, { status: 400 });
        // }

        // hash the password
        const hashedPassword = await bcrypt.hash(data.password, 12);
        newUser.password = hashedPassword;

        // save the user
        await newUser.save();

        // remove the password from the response
        newUser.password = undefined;

        // return the response
        return NextResponse.json({ message: 'User added successfully', data: newUser, ...successObj }, { status: 200 });
    } catch (error: any) {
        console.log(error);
        return NextResponse.json({ message: error.message, ...errorObj }, { status: 400 });
    }
}