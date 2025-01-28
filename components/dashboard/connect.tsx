import '@ant-design/v5-patch-for-react-19';
import React, { useState } from 'react'
import { login } from '../api/user';
import { message, Button } from 'antd';
import { stripeAccesscode } from '../api/stripe/Oauth/Oauth';


const Connect = () => {



    return(
        <div className='flex flex-col items-center justify-between h-screen'>
            <div>
                <button onClick={stripeAccesscode}>
                    Stripe
                </button>
            </div>
            <div>
                <button>
                    Hubspot
                </button>
            </div>
        </div>
    );
}
export  {Connect};