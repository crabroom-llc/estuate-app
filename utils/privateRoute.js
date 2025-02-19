import jwt from 'jsonwebtoken';
import { query } from './mysql';
import { NextResponse } from 'next/server';

const privateRoute = async (req) => {
    try {
        const headers = req.headers.get('Authorization');

        if (!headers) {
            throw new Error('Access Denied: No Authorization header provided');
        }

        const token = headers.split(' ')[1];
        console.log("🚀 => token in private route:", token);
        if (!token) {
            throw new Error('Access Denied: No token provided');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            throw new Error('Access Denied: Invalid token');
        }

        const user = await query('SELECT * FROM users WHERE id = ?', [decoded.id]);
        if (!user || user.length === 0) {
            throw new Error('Access Denied: User not found');
        }

        req.user = user[0];
        return user[0];

    } catch (error) {
        console.error("Authorization Error:", error.message);

        return NextResponse.json(
            { message: error.message || "Unauthorized Access" },
            { status: 401 }
        );
    }
};

export default privateRoute;
