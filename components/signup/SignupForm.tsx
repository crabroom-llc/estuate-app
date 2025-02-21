// import '@ant-design/v5-patch-for-react-19';
import React, { useState } from 'react'
import { addUser } from '../api/user';
// import { Button, message } from 'antd';

const SignUpForm = () => {

    const [loading, setLoading] = useState(false);

    const handleFormSubmit = async (e: any) => {
        e.preventDefault();

        const userObj = {
            firstName: e.target.firstName.value,
            lastName: e.target.lastName.value,
            email: e.target.email.value,
            password: e.target.password.value,
        };

        setLoading(true); // Show loading state

        try {
            // Attempt to add the user
            const signUpUser = await addUser(userObj);

            // Success message
            // message.success('User registered successfully', 5);

            // Redirect to login page
            window.location.href = '/login';
        } catch (error: any) {
            // Handle errors gracefully
            console.error('Error registering user:', error);
            // message.error(error.message || 'An error occurred during registration', 5);
        } finally {
            // Cleanup logic (e.g., hide loading spinner)
            setLoading(false);
        }
    };


    return (
        <div className='flex flex-col items-center justify-center h-screen'>
            <div className="flex flex-col border rounded px-4 py-2">
                <h1 className='font-semibold text-3xl text-center mb-6 underline'>Sign Up</h1>
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
                    <button
                        type='submit'
                        // loading={loading}
                        // iconPosition="end"
                        className='flex justify-center rounded border border-black bg-white text-black hover:bg-black hover:text-white transition duration-300 py-2'
                    >
                        SignUp
                        {loading && <div className="ms-3 inline w-6 h-6 border-2 border-solid border-t-transparent rounded-full border-gray-600 animate-spin"></div>}
                    </button>
                </form>
                <div>
                    <p className='text-center mt-4'>{"Already have an account ? "}<a href='/login' className='text-blue-500'>Login</a></p>
                </div>
            </div>
        </div>
    )
}

export default SignUpForm
