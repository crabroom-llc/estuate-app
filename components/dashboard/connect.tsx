import "@ant-design/v5-patch-for-react-19";
import React, { useState } from "react";
import { Button, Spin } from "antd";
import { stripeAccesscode } from "../api/stripe/Oauth/Oauth";
import { hubspotAccessCode } from "../api/hubspot/Oauth/Oauth";
// import { hubspotAccessCode } from "../api/hubspot/Oauth/Oauth";
import { LoadingOutlined } from "@ant-design/icons";

const Connect = () => {
  const [loading, setLoading] = useState(false);
  const [hubspotLoading, setHubspotLoading] = useState(false);

  /** Handle Stripe OAuth */
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

  /** Handle HubSpot OAuth */
  const handleHubSpotButton = async () => {
    setHubspotLoading(true);
    try {
      const HubspotOauthData = await hubspotAccessCode();
      if (HubspotOauthData.url) {
        window.location.href = HubspotOauthData.url;
      } else {
        console.error("URL field is missing in the response");
        throw new Error("URL field is missing in the response");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setHubspotLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-6">
      {/* Stripe Connect Button */}
      <Button 
        type="primary" 
        style={{ backgroundColor: "#635BFF", borderColor: "#635BFF" }} 
        onClick={handleStripeButton} 
        disabled={loading}
      >
        Connect Stripe {loading && <Spin indicator={<LoadingOutlined style={{ fontSize: 16, color: "#FFFFFF" }} spin />} className="ml-2" />}
      </Button>

      {/* HubSpot Connect Button */}
      <Button   
        type="primary" 
        style={{ backgroundColor: "#FF7A59", borderColor: "#FF7A59" }}
        onClick={handleHubSpotButton}
        disabled={hubspotLoading}
      >
        Connect HubSpot {hubspotLoading && <Spin indicator={<LoadingOutlined style={{ fontSize: 16, color: "#FFFFFF" }} spin />} className="ml-2" />}
      </Button>
    </div>
  );
};

export { Connect };
