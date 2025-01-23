import '@ant-design/v5-patch-for-react-19';
import React, { useState } from 'react'
import { addUser } from '../api/user';
import { Button, message } from 'antd';

const SignUpForm = () => {

    const [loading, setLoading] = useState(false);

    const handleFormSubmit = async (e: any) => {
        e.preventDefault()
        const userObj = {
            firstName: e.target.firstName.value,
            lastName: e.target.lastName.value,
            email: e.target.email.value,
            password: e.target.password.value
        }
        setLoading(true);
        const signUpUser = await addUser(userObj);
        message.success('User registered successfully', 5);
        setLoading(false);
        window.location.href = '/login';
    }

    return (
        <div className='flex flex-col items-center justify-center h-screen'>
            <div className="flex flex-col border rounded px-4 py-2">
                <h1 className='font-semibold text-3xl text-center mb-6 underline'>Sign Up Form</h1>
                <form className='flex flex-col gap-y-4' onSubmit={handleFormSubmit}>
                    <input
                        type="text"
                        name="firstName"
                        id="firstName"
                        placeholder='First Name'
                        className='border w-80 h-12 rounded-md px-2'
                    />
                    <input
                        type="text"
                        name="lastName"
                        id="lastName"
                        placeholder='Last Name'
                        className='border w-80 h-12 rounded-md px-2'
                    />
                    <input
                        type="email"
                        name="email"
                        id="email"
                        placeholder='Email'
                        className='border w-80 h-12 rounded-md px-2'
                    />
                    <input
                        type="password"
                        name="password"
                        id="password"
                        placeholder='Password'
                        className='border w-80 h-12 rounded-md px-2'
                    />
                    <Button
                        htmlType='submit'
                        loading={loading}
                        iconPosition="end"
                        className='rounded border border-black bg-white text-black hover:bg-black hover:text-white transition duration-300 py-2'
                    >
                        SignUp
                    </Button>
                </form>
                <div>
                    <p className='text-center mt-4'>{"Already have an account ? "}<a href='/login' className='text-blue-500'>Login</a></p>
                </div>
            </div>
        </div>
    )
}

export default SignUpForm
