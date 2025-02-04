import "@ant-design/v5-patch-for-react-19";
import { message } from "antd";

import { getCookie, setCookie } from "@/utils/cookies";

const token = getCookie(null,'token');
const userId = getCookie(null,'id');



const stripeAccesscode = async () => {
    try {
      const response = await fetch("/api/stripe/oauth", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
  
      // Log the full response object for debugging
      // console.log("Full Response:", response);
  
      // Check if the response is successful
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      // Parse and log the JSON response
      const data = await response.json();
      // console.log("Parsed Response:", data);
      // console.log(data.url);
      // Check if the `url` field exists
      return data;
    } catch (error: any) {
      // Log any errors that occur
      console.error("Error in stripeAccesscode:", error.message);
      return null; // Return null in case of an error
    }
  };
  

const generateAccessCode = async (code) => {
  const response = await fetch("/api/stripe/oauth", {
    method: "POST",
    body: JSON.stringify({ code, userId }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  console.log(data.success);
  return data.success;
};

export { stripeAccesscode, generateAccessCode };
