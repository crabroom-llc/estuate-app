import "@ant-design/v5-patch-for-react-19";
import React, { useEffect, useState } from "react";
import { Button, Spin } from "antd";
import { stripeAccesscode } from "../api/stripe/Oauth/Oauth";
import { hubspotAccessCode } from "../api/hubspot/Oauth/Oauth";
// import { hubspotAccessCode } from "../api/hubspot/Oauth/Oauth";
import { LoadingOutlined } from "@ant-design/icons";
import { getUserOauth } from "../api/user";
import "./connect.css";

const Connect = () => {
  const [loading, setLoading] = useState(false);
  const [hubspotLoading, setHubspotLoading] = useState(false);
  const [userConnection, setUserConnection] = useState<any>({
    isStripeConnected: false,
    isHubspotConnected: false,
  });
  const [screenLoading, setScreenLoading] = useState(false);

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

  const getUserOAuthDetails = async () => {
    try {
      setScreenLoading(true);
      const data = await getUserOauth();
      setUserConnection(data);
      setScreenLoading(false);
    } catch (error) {
      setScreenLoading(false);
      console.error(error);
    }
  };

  useEffect(() => {
    getUserOAuthDetails();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-[95vh] space-y-6">
      {screenLoading && (
        <div className="fixed inset-0 backdrop-blur-sm z-[9999] flex items-center justify-center text-white">
          <div className="w-10 h-10 border-4 border-solid border-t-transparent rounded-full border-gray-600 animate-spin"></div>
        </div>
      )}
      {/* User info that his stripe account is connectec or not and same for hubspot in a sentence */}
      <div className="text-lg font-semibold text-center p-4 rounded-md bg-gray-100 shadow-md w-3/4 md:w-1/2">
        <p className="text-gray-700">
          {userConnection.isStripeConnected && userConnection.isHubspotConnected ? (
            <span>
              Your <span className="text-blue-600 font-bold">Stripe</span> and <span className="text-orange-600 font-bold">HubSpot</span> accounts are connected!
            </span>
          ) : userConnection.isStripeConnected ? (
            <span>
              Your <span className="text-blue-600 font-bold">Stripe</span> account is connected, but <span className="text-orange-600 font-bold">HubSpot</span> is not.
              <br />Click the <span className="text-orange-600 font-bold">&quot;Connect HubSpot&quot;</span> button below to complete the setup.
            </span>
          ) : userConnection.isHubspotConnected ? (
            <span>
              Your <span className="text-orange-600 font-bold">HubSpot</span> account is connected, but <span className="text-blue-600 font-bold">Stripe</span> is not.
              <br />Click the <span className="text-blue-600 font-bold">&quot;Connect Stripe&quot;</span> button below to complete the setup.
            </span>
          ) : (
            <span>
              You are not connected to <span className="text-blue-600 font-bold">Stripe</span> or <span className="text-orange-600 font-bold">HubSpot</span>.
              <br />Please click the respective buttons below to connect your accounts.
            </span>
          )}
        </p>
      </div>


      {/* Stripe Connect Button */}
      <Button
        type="primary"
        className={`text-white ${userConnection.isStripeConnected ? "stripe-disabled" : "stripe-enabled"}`}
        onClick={handleStripeButton}
        disabled={loading || userConnection.isStripeConnected}
      >
        Connect Stripe
        {loading && (
          <Spin
            indicator={<LoadingOutlined style={{ fontSize: 16, color: "#FFFFFF" }} spin />}
            className="ml-2"
          />
        )}
      </Button>

      {/* HubSpot Connect Button */}
      <Button
        type="primary"
        className={`text-white ${userConnection.isHubspotConnected ? "hubspot-disabled" : "hubspot-enabled"}`}
        onClick={handleHubSpotButton}
        disabled={hubspotLoading || userConnection.isHubspotConnected}
      >
        Connect HubSpot {hubspotLoading && <Spin indicator={<LoadingOutlined style={{ fontSize: 16, color: "#FFFFFF" }} spin />} className="ml-2" />}
      </Button>
    </div>
  );
};

export { Connect };
