import '@ant-design/v5-patch-for-react-19';
import { message } from 'antd';

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
        message.error(data.message || "Some error occured while signing up. Please try again later", 5);
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
    }else{
        message.error(data.message || "Some error occured while logging in. Please try again later", 5);
    }
}


export { addUser, login };