import "@ant-design/v5-patch-for-react-19";
import React, { useState } from "react";
import { login } from "../api/user";
import { message, Button } from "antd";
import { stripeAccesscode } from "../api/stripe/Oauth/Oauth";

const Connect = () => {
  const HandleStripebutton = async () => {
    const StripeOauthData = await stripeAccesscode();
    // console.log(StripeOauthData);
    if (StripeOauthData.url) {
      window.location.href = StripeOauthData.url;
    } else {
      console.log("URL field is missing in the response");
      throw new Error("URL field is missing in the response");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="flex flex-col items-center justify-between h-48">
        <div>
          <button onClick={HandleStripebutton}>Stripe</button>
        </div>
        <div>
          <button>Hubspot</button>
        </div>
      </div>
    </div>
  );
};
export { Connect };
