// import "@ant-design/v5-patch-for-react-19";
// import { message } from "antd";

import { getCookie, setCookie } from "@/utils/cookies";

const token = getCookie(null, "token");
const userId = getCookie(null, "id");

/**
 * Fetch the HubSpot OAuth URL to redirect the user for authentication.
 */
const hubspotAccessCode = async () => {
  try {
    const response = await fetch("/api/hubspot/oauth", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    // Check if the response is successful
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Parse and log the JSON response
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error in hubspotAccessCode:", error.message);
    return null;
  }
};

/**
 * Exchange the authorization code for a HubSpot access token.
 */
const generateHubSpotAccessToken = async (code: string) => {
  console.log(userId);
  try {
    const response = await fetch("/api/hubspot/oauth", {
      method: "POST",
      body: JSON.stringify({ code, userId }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    // Parse response JSON
    const data = await response.json();
    console.log(data);
    return data.success;
  } catch (error: any) {
    console.error("Error in generateHubSpotAccessToken:", error.message);
    return false;
  }
};

export { hubspotAccessCode, generateHubSpotAccessToken };
