// import '@ant-design/v5-patch-for-react-19';
// import { message } from 'antd';
import { getCookie, setCookie } from '@/utils/cookies';

const token = getCookie(null, 'token');

const addUser = async (user: any) => {
    const response = await fetch('/api/mongo/add-user', {
        method: 'POST',
        body: JSON.stringify(user),
        headers: {
            'Content-Type': 'application/json',
        },
    });
    const data = await response.json();
    if (data.success) {
        return data.data;
    } else {
        console.log(data.message);
        // message.error(data.message || "Some error occured while signing up. Please try again later", 5);
    }
}

const login = async (user: any) => {
    const response = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify(user),
        headers: {
            'Content-Type': 'application/json',
        },
    });
    const data = await response.json();
    if (data.success) {
        return data.data;
    } else {
        console.log(data.message);
        // message.error(data.message || "Some error occured while logging in. Please try again later", 5);
    }
}

const getUserInfoByToken = async () => {
    const response = await fetch('/api/mongo/get-user', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });
    if (response.status === 401) {
        window.location.href = "/login";
        setCookie(null, 'token', '');
        setCookie(null, 'userId', '');
        console.log("Unauthorized: Invalid or expired token");
        // return message.error("Unauthorized: Invalid or expired token", 5);
    }
    const data = await response.json();
    if (data.success) {
        return data.data;
    } else {
        console.log(data.message);
        // message.error(data.message || "Some error occured while fetching user data. Please try again later", 5);
    }
};

const getUserOauth = async () => {
    const response = await fetch('/api/mongo/get-oauth-user', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    });
    if (response.status === 401) {
        window.location.href = "/login";
        setCookie(null, 'token', '');
        setCookie(null, 'userId', '');
        console.log("Unauthorized: Invalid or expired token");
        // return message.error("Unauthorized: Invalid or expired token", 5);
    }
    const data = await response.json();
    if (data.success) {
        return data.data;
    } else {
        console.log(data.message);
        // message.error(data.message || "Some error occured while fetching user data. Please try again later", 5);
    }
}





export { addUser, login, getUserInfoByToken, getUserOauth };