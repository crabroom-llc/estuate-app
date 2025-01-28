import jwt from 'jsonwebtoken';
import { query } from './mysql'


const privateRoute = async (req) => {
    try {
        const headers = req.headers.get('Authorization');
        const token = headers.split(' ')[1];
        if (!token) {
            throw new Error('Access Denied');
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            throw new Error('Access Denied');
        }
        const user = await query('SELECT * FROM users WHERE id = ?', decoded.id)[0];
        if (!user) {
            throw new Error('Access Denied');
        }
        req.user = user;
        return user;
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

export default privateRoute;