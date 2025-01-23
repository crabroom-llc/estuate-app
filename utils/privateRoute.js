import jwt from 'jsonwebtoken';
import UserModel  from '@/mongodb/models/UserModel';


const privateRoute = async (req, res, next) => {
    try {
        const headers = req.header('Authorization');
        // split the token to get the actual token
        const token = headers.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await UserModel.findById(decoded._id);
        // console.log(decoded);
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

export default privateRoute;