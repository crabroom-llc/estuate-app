// import '@ant-design/v5-patch-for-react-19';
// import { message } from 'antd';
import { getCookie, setCookie } from '@/utils/cookies';

const token = getCookie(null, 'token');

const getPaymentMethod = async () => {
    try {
        const response = await fetch('/api/hubspot/get-payment-method', {
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
            // message.error(data.message || "Some error occured while fetching payment method. Please try again later", 5);
        }
    } catch (error: any) {
        console.error(error.message);
        // message.error("Some error occured while fetching payment method. Please try again later", 5);
    }
};


const updatePaymentMethod = async (save_payment_method: any) => {
    try {
        const response = await fetch('/api/hubspot/update-payment-method', {
            method: 'POST',
            body: JSON.stringify({ save_payment_method }),
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
            // message.error(data.message || "Some error occured while updating payment method. Please try again later", 5);
        }
    } catch (error: any) {
        console.error(error.message);
        // message.error("Some error occured while updating payment method. Please try again later", 5);
    }
};


export { getPaymentMethod, updatePaymentMethod };