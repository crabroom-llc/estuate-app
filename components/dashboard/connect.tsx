import "@ant-design/v5-patch-for-react-19";
import React, { useState } from "react";
import { Button, Spin } from "antd";
import { stripeAccesscode } from "../api/stripe/Oauth/Oauth";
import { LoadingOutlined } from "@ant-design/icons";

const Connect = () => {
  const [loading, setLoading] = useState(false);

  const handleStripeButton = async () => {
    setLoading(true);
    try {
      const StripeOauthData = await stripeAccesscode();
      if (StripeOauthData.url) {
        window.location.href = StripeOauthData.url;
      } else {
        console.error("URL field is missing in the response");
        throw new Error("URL field is missing in the response");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-6">
      <Button 
        type="primary" 
        style={{ backgroundColor: "#635BFF", borderColor: "#635BFF" }} 
        onClick={handleStripeButton} 
        disabled={loading}
      >
        Connect Stripe {loading && <Spin indicator={<LoadingOutlined style={{ fontSize: 16, color: "#FFFFFF" }} spin />} className="ml-2" />}
      </Button>
      
      <Button   
        type="primary" 
        style={{ backgroundColor: "#FF7A59", borderColor: "#FF7A59" }}
      >
        Connect HubSpot
      </Button>
    </div>
  );
};

export { Connect };
