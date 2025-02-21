// import '@ant-design/v5-patch-for-react-19';
import React, { useState } from 'react'
import { login } from '../api/user';
// import { message, Button } from 'antd';
import { getCookie, setCookie } from '@/utils/cookies';

const LoginForm = () => {

    const [loading, setLoading] = useState(false);

    const handleFormSubmit = async (e: any) => {
        e.preventDefault();
        // if (!e.target.email.value || !e.target.password.value) {
        //     message.error('Please fill all the fields',5);
        //     return;
        // }
        const userObj = {
            email: e.target.email.value,
            password: e.target.password.value
        }
        try {
            setLoading(true);
            const loginUser = await login(userObj);
            setCookie(null, 'token', loginUser.token);
            // remove token from the response
            loginUser.token = undefined;
            Object.keys(loginUser).forEach(key => {
                if (key !== 'token') {
                    setCookie(null, key, loginUser[key]);
                }
                if (key === 'id') {
                    setCookie(null, 'userId', loginUser[key]);
                }
            }); // remove token from the response
            setLoading(false);
            // message.success('User logged in successfully', 5);
            window.location.href = '/dashboard';
        } catch (error) {
            setLoading(false);
            console.log(error);
        }
        finally {
            setLoading(false);
        }
    }

    return (
        <div className='flex flex-col items-center justify-center h-screen'>
            <div className="flex flex-col border rounded px-4 py-2">
                <h1 className='font-semibold text-3xl text-center mb-6 underline'>Login</h1>
                <form className='flex flex-col gap-y-4' onSubmit={handleFormSubmit}>
                    <input
                        type="email"
                        name="email"
                        id="email"
                        placeholder='Email'
                        className='border w-80 h-12 rounded-md px-2'
                        required
                    />
                    <input
                        type="password"
                        name="password"
                        id="password"
                        placeholder='Password'
                        className='border w-80 h-12 rounded-md px-2'
                        required
                    />
                    <button
                        // htmlType='submit'
                        // loading={loading}
                        // iconPosition="end"
                        className='flex justify-center rounded border border-black bg-white text-black hover:bg-black hover:text-white transition duration-300 py-2'
                    >
                        Login
                        {loading && (
                            <div className="ms-3 inline w-6 h-6 border-2 border-solid border-t-transparent rounded-full border-gray-600 animate-spin"></div>
                        )}
                    </button>
                </form>
                <div>
                    <p className='text-center mt-4'>{"Don't have an account ? "}<a href='/signup' className='text-blue-500'>Register</a></p>
                </div>
            </div>
        </div>
    )
}

export default LoginForm
