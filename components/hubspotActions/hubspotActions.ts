
import axios from "axios";





const checkHubSpotProperty = async (hubspotAccessToken) => {
    try {
      const response = await axios.get(
        `https://api.hubapi.com/crm/v3/properties/contacts/stripe_customer_id`,
        {
          headers: {
            Authorization: `Bearer ${hubspotAccessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
  
      console.log("✅ Property stripe_customer_id exists.");
      return true;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn("⚠️ Property stripe_customer_id does not exist.");
        return false;
      }
      console.error(
        "❌ Error checking HubSpot property:",
        error.response?.data || error.message
      );
      return false;
    }
  };




  const createHubSpotProperty = async (hubspotAccessToken) => {
    try {
      const response = await axios.post(
        `https://api.hubapi.com/crm/v3/properties/contacts`,
        {
          name: "stripe_customer_id",
          label: "Stripe Customer ID",
          type: "string",
          fieldType: "text",
          groupName: "contactinformation",
          description: "The Stripe Customer ID associated with this contact",
          displayOrder: -1,
          hasUniqueValue: false,
          hidden: false,
          formField: true,
        },
        {
          headers: {
            Authorization: `Bearer ${hubspotAccessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
  
      console.log("✅ Custom Property Created:", response.data);
      return response.data;
    } catch (error: any) {
      console.error(
        "❌ Error creating HubSpot property:",
        error.response?.data || error.message
      );
    }
  };

  




// ✅ Function to Update Contact in HubSpot
const updateHubSpotContact = async (
    contactId,
    stripeCustomerId,
    hubspotAccessToken
  ) => {
    try {
      // 🔍 Check if property exists before updating
      const propertyExists = await checkHubSpotProperty(hubspotAccessToken);
      if (!propertyExists) {
        console.log("🛠️ Creating missing property: stripe_customer_id...");
        await createHubSpotProperty(hubspotAccessToken);
      }
  
      // 🔹 Now update the contact
      const response = await axios.patch(
        `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`,
        { properties: { stripe_customer_id: stripeCustomerId } },
        {
          headers: {
            Authorization: `Bearer ${hubspotAccessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
  
      console.log("✅ HubSpot Contact Updated with Stripe ID:", response.data);
      return response.data;
    } catch (error: any) {
      console.error(
        "❌ Error updating HubSpot contact:",
        error.response?.data || error.message
      );
    }
  };
  


  // ✅ Function to Fetch HubSpot Contact
const fetchHubSpotContact = async (contactId, hubspotAccessToken) => {
    try {
      const response = await axios.get(
        `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`,
        {
          headers: {
            Authorization: `Bearer ${hubspotAccessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log(response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Error fetching contact details:", error.response.data);
      return null;
    }
  };



  const fetchHubSpotProducts = async (hubspotAccessToken) => {
    try {
      const response = await axios.get(
        "https://api.hubapi.com/crm/v3/objects/products",
        {
          headers: {
            Authorization: `Bearer ${hubspotAccessToken}`,
            "Content-Type": "application/json",
          },
          params: {
            properties: "name,price,description", // Fetch specific product fields
            limit: 10, // Limit results to 10 (adjust as needed)
          },
        }
      );
      console.log(response.data);
      return response.data;
    } catch (error: any) {
      console.error(
        "❌ Error fetching products:",
        error.response?.data || error.message
      );
      return null;
    }
  };
  

  const fetchContactStripeId = async (contactId: string, hubspotAccessToken: string) => {
    try {
        const response = await axios.get(
            `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?properties=stripe_customer_id`,
            {
                headers: {
                    Authorization: `Bearer ${hubspotAccessToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("✅ Contact Data Retrieved:", response.data);
        console.log(response.data?.properties?.stripe_customer_id)
        return response.data?.properties?.stripe_customer_id;
    } catch (error: any) {
        console.error("❌ Error fetching contact details:", error.response?.data || error.message);
        return null;
    }
};




const fetchProduct = async(productId: string, hubspotAccessToken: string) =>{
  try {
    const url = `https://api.hubapi.com/crm/v3/objects/products/${productId}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${hubspotAccessToken}`,
        "Content-Type": "application/json",
      },
      params: {
        properties: "name,price,sku,description,billing_frequency,createdate,hs_lastmodifieddate",
      },
    });

    console.log("✅ HubSpot Product Details:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Error fetching product details:", error.response?.data || error.message);
    return null;
  }

};
const fetchProductById = async(productId: string, hubspotAccessToken: string) =>{
  try {
    const url = `https://api.hubapi.com/crm/v3/objects/products/${productId}?properties=stripe_product_id`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${hubspotAccessToken}`,
        "Content-Type": "application/json",
      },
      params: {
        properties: "name,price,sku,description,billing_frequency,createdate,hs_lastmodifieddate",
      },
    });

    console.log("✅ HubSpot Product Details:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Error fetching product details:", error.response?.data || error.message);
    return null;
  }

};


// ✅ Function to Check if `stripe_product_id` Exists in HubSpot
const checkHubSpotProductProperty = async (hubspotAccessToken: string) => {
  try {
    await axios.get(
      `https://api.hubapi.com/crm/v3/properties/products/stripe_product_id`,
      {
        headers: {
          Authorization: `Bearer ${hubspotAccessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Property `stripe_product_id` exists.");
    return true;
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.warn("⚠️ Property `stripe_product_id` does not exist.");
      return false;
    }
    console.error(
      "❌ Error checking HubSpot product property:",
      error.response?.data || error.message
    );
    return false;
  }
};

// ✅ Function to Create `stripe_product_id` Property in HubSpot
const createHubSpotProductProperty = async (hubspotAccessToken: string) => {
  try {
    const response = await axios.post(
      `https://api.hubapi.com/crm/v3/properties/products`,
      {
        name: "stripe_product_id",
        label: "Stripe Product ID",
        type: "string",
        fieldType: "text",
        groupName: "productinformation",
        description: "The Stripe Product ID associated with this product",
        displayOrder: -1,
        hasUniqueValue: false,
        hidden: false,
        formField: true,
      },
      {
        headers: {
          Authorization: `Bearer ${hubspotAccessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Custom Property `stripe_product_id` Created:", response.data);
    return response.data;
  } catch (error: any) {
    console.error(
      "❌ Error creating HubSpot product property:",
      error.response?.data || error.message
    );
  }
};

// ✅ Function to Update HubSpot Product with `stripe_product_id`
const updateHubSpotProduct = async (
  productId: string,
  stripeProductId: string,
  hubspotAccessToken: string
) => {
  try {
    // 🔍 Check if `stripe_product_id` exists before updating
    const propertyExists = await checkHubSpotProductProperty(hubspotAccessToken);
    if (!propertyExists) {
      console.log("🛠️ Creating missing property: `stripe_product_id`...");
      await createHubSpotProductProperty(hubspotAccessToken);
    }

    // 🔹 Now update the product in HubSpot
    const response = await axios.patch(
      `https://api.hubapi.com/crm/v3/objects/products/${productId}`,
      { properties: { stripe_product_id: stripeProductId } },
      {
        headers: {
          Authorization: `Bearer ${hubspotAccessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ HubSpot Product Updated with Stripe ID:", response.data);
    return response.data;
  } catch (error: any) {
    console.error(
      "❌ Error updating HubSpot product:",
      error.response?.data || error.message
    );
  }
};




  export { updateHubSpotContact, fetchHubSpotContact, fetchContactStripeId, fetchProduct, updateHubSpotProduct, fetchProductById };