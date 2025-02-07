import axios from "axios";
import { fetchStripePriceDetails } from "@/components/stripeActions/stripeActions";
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

const fetchContactStripeId = async (
  contactId: string,
  hubspotAccessToken: string
) => {
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
    console.log(response.data?.properties?.stripe_customer_id);
    return response.data?.properties?.stripe_customer_id;
  } catch (error: any) {
    console.error(
      "❌ Error fetching contact details:",
      error.response?.data || error.message
    );
    return null;
  }
};

const fetchProduct = async (productId: string, hubspotAccessToken: string) => {
  try {
    const url = `https://api.hubapi.com/crm/v3/objects/products/${productId}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${hubspotAccessToken}`,
        "Content-Type": "application/json",
      },
      params: {
        properties:
          "name,price,sku,description,billing_frequency,createdate,hs_lastmodifieddate",
      },
    });

    console.log("✅ HubSpot Product Details:", response.data);
    return response.data;
  } catch (error: any) {
    console.error(
      "❌ Error fetching product details:",
      error.response?.data || error.message
    );
    return null;
  }
};
const fetchProductById = async (
  productId: string,
  hubspotAccessToken: string
) => {
  try {
    const url = `https://api.hubapi.com/crm/v3/objects/products/${productId}?properties=stripe_product_id`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${hubspotAccessToken}`,
        "Content-Type": "application/json",
      },
      params: {
        properties:
          "name,price,sku,description,billing_frequency,createdate,hs_lastmodifieddate",
      },
    });

    console.log("✅ HubSpot Product Details:", response.data);
    return response.data;
  } catch (error: any) {
    console.error(
      "❌ Error fetching product details:",
      error.response?.data || error.message
    );
    return null;
  }
};

// const fetchProductandPricesById = async (
//   productId: string,
//   hubspotAccessToken: string
// ) => {
//   try {
//     const baseUrl = `https://api.hubapi.com/crm/v3/objects/products/${productId}?properties=stripe_product_id`;

//     // ✅ First API Call: Fetch Product Details with all necessary properties
//     const response = await axios.get(baseUrl, {
//       headers: {
//         Authorization: `Bearer ${hubspotAccessToken}`,
//         "Content-Type": "application/json",
//       },
//       params: {
//         properties:
//           "name,price,sku,description,billing_frequency,createdate,hs_lastmodifieddate,stripe_product_id,stripe_price_id",
//       },
//     });

//     let productData = response.data;
//     console.log("✅ HubSpot Product Details (First Call):", productData);

//     // ✅ Check if `stripe_price_id` is missing
//     if (!productData.properties?.stripe_price_id) {
//       console.warn("⚠️ `stripe_price_id` is missing. Fetching separately...");

//       // ✅ Second API Call: Fetch `stripe_price_id` if missing
//       const priceResponse = await axios.get(baseUrl, {
//         headers: {
//           Authorization: `Bearer ${hubspotAccessToken}`,
//           "Content-Type": "application/json",
//         },
//         params: {
//           properties: "stripe_price_id",
//         },
//       });

//       console.log(
//         "✅ Fetched `stripe_price_id` separately:",
//         priceResponse.data
//       );

//       // ✅ Merge `stripe_price_id` into original response
//       productData.properties.stripe_price_id =
//         priceResponse.data.properties.stripe_price_id;
//     }

//     return productData;
//   } catch (error: any) {
//     console.error(
//       "❌ Error fetching product details:",
//       error.response?.data || error.message
//     );
//     return null;
//   }
// };

// ✅ Function to Check if `stripe_product_id` Exists in HubSpot
// const checkHubSpotProductProperty = async (hubspotAccessToken: string) => {
//   try {
//     await axios.get(
//       `https://api.hubapi.com/crm/v3/properties/products/stripe_product_id`,
//       {
//         headers: {
//           Authorization: `Bearer ${hubspotAccessToken}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     console.log("✅ Property `stripe_product_id` exists.");
//     return true;
//   } catch (error: any) {
//     if (error.response?.status === 404) {
//       console.warn("⚠️ Property `stripe_product_id` does not exist.");
//       return false;
//     }
//     console.error(
//       "❌ Error checking HubSpot product property:",
//       error.response?.data || error.message
//     );
//     return false;
//   }
// };

const fetchProductandPricesById = async (
  productId: string,
  hubspotAccessToken: string
) => {
  try {
    const baseUrl = `https://api.hubapi.com/crm/v3/objects/products/${productId}`;

    // ✅ First API Call: Fetch Product Details with all necessary properties
    const response = await axios.get(baseUrl, {
      headers: {
        Authorization: `Bearer ${hubspotAccessToken}`,
        "Content-Type": "application/json",
      },
      params: {
        properties:
          "name,price,sku,description,billing_frequency,createdate,hs_lastmodifieddate,stripe_product_id,stripe_price_id",
      },
    });

    let productData = response.data;
    console.log("✅ HubSpot Product Details (First Call):", productData);

    // ✅ Check if `stripe_price_id` is missing
    if (!productData.properties?.stripe_price_id) {
      console.warn("⚠️ `stripe_price_id` is missing. Fetching separately...");

      // ✅ Second API Call: Fetch `stripe_price_id` if missing
      const priceResponse = await axios.get(baseUrl, {
        headers: {
          Authorization: `Bearer ${hubspotAccessToken}`,
          "Content-Type": "application/json",
        },
        params: { properties: "stripe_price_id" },
      });

      console.log(
        "✅ Fetched `stripe_price_id` separately:",
        priceResponse.data
      );

      // ✅ Merge `stripe_price_id` into original response
      productData.properties.stripe_price_id =
        priceResponse.data.properties.stripe_price_id;
    }

    return productData;
  } catch (error: any) {
    console.error(
      "❌ Error fetching product details:",
      error.response?.data || error.message
    );
    return null;
  }
};

const checkHubSpotProductProperties = async (hubspotAccessToken: string) => {
  try {
    const properties = ["stripe_product_id", "stripe_price_id"];
    let results = {};

    for (const property of properties) {
      try {
        await axios.get(
          `https://api.hubapi.com/crm/v3/properties/products/${property}`,
          {
            headers: {
              Authorization: `Bearer ${hubspotAccessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log(`✅ Property \`${property}\` exists.`);
        results[property] = true;
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.warn(`⚠️ Property \`${property}\` does not exist.`);
          results[property] = false;
        } else {
          console.error(
            `❌ Error checking HubSpot product property \`${property}\`:`,
            error.response?.data || error.message
          );
          results[property] = false;
        }
      }
    }

    return results;
  } catch (error: any) {
    console.error(
      "❌ Error checking HubSpot product properties:",
      error.response?.data || error.message
    );
    return { stripe_product_id: false, stripe_price_id: false };
  }
};

// ✅ Function to Create `stripe_product_id` Property in HubSpot
const createHubSpotProductProperty = async (hubspotAccessToken: string) => {
  try {
    const properties = [
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
        name: "stripe_price_id",
        label: "Stripe Price ID",
        type: "string",
        fieldType: "text",
        groupName: "productinformation",
        description: "The Stripe Price ID associated with this product",
        displayOrder: -1,
        hasUniqueValue: false,
        hidden: false,
        formField: true,
      },
    ];

    for (const property of properties) {
      try {
        const response = await axios.post(
          `https://api.hubapi.com/crm/v3/properties/products`,
          property, // ✅ Send individual property, NOT an array
          {
            headers: {
              Authorization: `Bearer ${hubspotAccessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log(`✅ Property "${property.name}" created:`, response.data);
      } catch (error: any) {
        console.error(
          `❌ Error creating property "${property.name}":`,
          error.response?.data || error.message
        );
      }
    }
  } catch (error: any) {
    console.error(
      "❌ Error creating HubSpot product properties:",
      error.response?.data || error.message
    );
  }
};

// ✅ Function to Update HubSpot Product with `stripe_product_id`
const updateHubSpotProduct = async (
  productId: string,
  stripeProductId: string,
  stripePriceId: string,
  hubspotAccessToken: string
) => {
  try {
    // 🔍 Check if `stripe_product_id` exists before updating
    const propertyExists = await checkHubSpotProductProperties(
      hubspotAccessToken
    );
    if (
      !propertyExists["stripe_product_id"] ||
      !propertyExists["stripe_price_id"]
    ) {
      console.log(
        "🛠️ Creating missing properties: `stripe_product_id` and/or `stripe_price_id`..."
      );
      await createHubSpotProductProperty(hubspotAccessToken);
    }

    // 🔹 Now update the product in HubSpot
    const response = await axios.patch(
      `https://api.hubapi.com/crm/v3/objects/products/${productId}`,
      {
        properties: {
          stripe_product_id: stripeProductId,
          stripe_price_id: stripePriceId,
        },
      },
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

//Deals
// const fetchDealById = async (dealId: string, hubspotAccessToken: string) => {
//   try {
//     const url = `https://api.hubapi.com/crm/v3/objects/deals/${dealId}`;

//     const response = await axios.get(url, {
//       headers: {
//         Authorization: `Bearer ${hubspotAccessToken}`,
//         "Content-Type": "application/json",
//       },
//       params: {
//         properties:
//           "dealname,amount,dealstage,pipeline,closedate,createdate,hs_lastmodifieddate,dealtype,hs_priority,hubspot_owner_id,associatedcompanyid,associatedcontactid",
//         associations: "contacts,companies,line_items",
//       },
//     });

//     console.log("✅ HubSpot Deal Details:", response.data);
//     let dealdata = response.data;
//     processHubspotDealCreated(dealdata, hubspotAccessToken);
//     // return response.data;
//   } catch (error: any) {
//     console.error(
//       "❌ Error fetching deal details:",
//       error.response?.data || error.message
//     );
//     return null;
//   }
// };
// const fetchDealById = async (dealId: string, hubspotAccessToken: string, stripeaccesstoken:string) => {
//   try {
//     const url = `https://api.hubapi.com/crm/v3/objects/deals/${dealId}`;

//     const response = await axios.get(url, {
//       headers: {
//         Authorization: `Bearer ${hubspotAccessToken}`,
//         "Content-Type": "application/json",
//       },
//       params: {
//         properties:
//           "dealname,amount,dealstage,pipeline,closedate,createdate,hs_lastmodifieddate,dealtype,hs_priority,hubspot_owner_id,associatedcompanyid,associatedcontactid",
//         associations: "contacts,companies,line_items",
//       },
//     });

//     console.log("✅ HubSpot Deal Details:", response.data);
//     let dealdata = response.data;
//     const result = await processHubspotDealCreated(
//       stripeaccesstoken,
//       dealdata,
//       hubspotAccessToken
//     );

//     if (result) {
//       console.log("✅ Final Processed Deal Data:", result);
//       return result; // Send final data where needed
//     }
//   } catch (error: any) {
//     console.error(
//       "❌ Error fetching deal details:",
//       error.response?.data || error.message
//     );
//     return null;
//   }
// };

const fetchDealById = async (
  dealId: string,
  hubspotAccessToken: string,
  stripeaccesstoken: string
) => {
  try {
    const url = `https://api.hubapi.com/crm/v3/objects/deals/${dealId}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${hubspotAccessToken}`,
        "Content-Type": "application/json",
      },
      params: {
        properties:
          "dealname,amount,dealstage,pipeline,closedate,createdate,hs_lastmodifieddate,dealtype,hs_priority,hubspot_owner_id,associatedcompanyid,associatedcontactid,dealstage",
        associations: "contacts,companies,line_items",
      },
    });

    console.log("✅ HubSpot Deal Details:", response.data);
    let dealData = response.data;

    // ✅ Extract associated line items
    let associatedLineItems =
      dealData.associations?.["line items"]?.results?.map((item) => item.id) ||
      [];
    let dealStage = dealData?.properties?.dealstage;
    if (dealStage != "closedwon") {
      console.log(
        `Deal stage is not in closed won current deal stage is ${dealStage}`
      );
      return null;
    }
    let lineItemsDetails = [] as any[];
    for (const lineItemId of associatedLineItems) {
      const lineItem = await fetchHubSpotLineItem(
        lineItemId,
        hubspotAccessToken
      );
      if (lineItem) {
        lineItemsDetails.push(lineItem);
      }
    }

    dealData["lineItems"] = lineItemsDetails; // ✅ Attach full line item details to deal

    const result = await processHubspotDealCreated(
      stripeaccesstoken,
      dealData,
      hubspotAccessToken
    );

    if (result) {
      console.log("✅ Final Processed Deal Data:", result);
      return result;
    }
  } catch (error: any) {
    console.error(
      "❌ Error fetching deal details:",
      error.response?.data || error.message
    );
    return null;
  }
};

// Function to fetch full line item details
const fetchHubSpotLineItem = async (lineItemId, hubspotAccessToken) => {
  try {
    const url = `https://api.hubapi.com/crm/v3/objects/line_items/${lineItemId}?properties=name,price,quantity,billing_frequency,hs_lastmodifieddate,hs_product_id,quantity`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${hubspotAccessToken}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching line item (${lineItemId}):`, error);
    return null;
  }
};

// const processHubspotDealCreated = async (dealData, hubspotAccessToken) => {
//   try {
//     console.log("🔹 Raw HubSpot Deal Data:", JSON.stringify(dealData, null, 2));

//     // Extract main deal properties
//     const dealId = dealData.id;
//     const dealName = dealData.properties.dealname;
//     const amount = parseFloat(dealData.properties.amount) || 0;
//     const closeDate = dealData.properties.closedate;
//     const dealStage = dealData.properties.dealstage;
//     const dealType = dealData.properties.dealtype;
//     const priority = dealData.properties.hs_priority;
//     const pipeline = dealData.properties.pipeline;
//     const productid = dealData.properties.hs_product_id;
//     const stripeCustomerIds = [] as any[];
//     const hubspotProductIds = [] as any[];
//     // Extract associated contacts
//     let associatedContacts = [];
//     if (dealData.associations?.contacts?.results) {
//       associatedContacts = dealData.associations.contacts.results.map(
//         (contact) => contact.id
//       );
//     }

//     // Extract associated line items (products)
//     let associatedLineItems = [];
//     if (dealData.associations?.["line items"]?.results) {
//       associatedLineItems = dealData.associations["line items"].results.map(
//         (item) => item.id
//       );
//     }

//     // case 1 when there are no line items then genereate an invoice
//     if (associatedLineItems.length === 0) {
//       console.log("no line data");

//       console.log(
//         "💰 No line items found. Creating Stripe Invoice for amount:",
//         amount
//       );
//       if (associatedContacts.length == 0) {
//         console.log("No Customer found");
//         return;
//       } else {
//         for (const contactId of associatedContacts) {
//           const stripeId = await fetchContactStripeId(
//             contactId,
//             hubspotAccessToken
//           );
//           stripeCustomerIds.push(stripeId);
//         }
//         const data = {
//           type: "invoice",
//           customer: stripeCustomerIds,
//         };
//         return data;
//       }
//       // return await createStripeInvoice(amount, dealName, stripeAccessToken);
//     }

//     // // 🔥 Fetch Full Line Item Details from HubSpot API
//     const collectedProducts: { hubspotProductId: string, stripeProductId: string, stripePriceId: string }[] = [];
//     let lineItemsData = [] as any[];
//     let hasRecurringItem = false;

//     for (const lineItemId of associatedLineItems) {
//       const lineItem = await fetchHubSpotLineItem(
//         lineItemId,
//         hubspotAccessToken
//       );

//       if (lineItem) {
//         lineItemsData.push(lineItem);

//         // 🔹 Retrieve HubSpot Product ID from the line item
//         const hubspotProductId = lineItem.properties.hs_product_id || null;
//         console.log("🔍 HubSpot Product ID:", hubspotProductId);

//         // 🔄 Check if this line item is recurring
//         switch (lineItem.properties.billing_frequency) {
//           case "weekly":
//           case "biweekly":
//           case "monthly":
//           case "quarterly":
//           case "per_six_months":
//           case "annually":
//           case "per_two_years":
//           case "per_three_years":
//           case "per_four_years":
//           case "per_five_years":
//             hasRecurringItem = true;
//             break;
//         }
//         console.log("product id is "+ hubspotProductId);
//         const productDetails = await fetchProductById(hubspotProductId, hubspotAccessToken);

//         if (!productDetails) {
//           console.warn(`⚠️ No product details found for Product ID: ${hubspotProductId}`);
//           continue;
//         }

//         // ✅ Extract Stripe Product & Price IDs
//         const stripeProductId = productDetails.properties?.stripe_product_id || null;
//         const stripePriceId = productDetails.properties?.stripe_price_id || null;
//         collectedProducts.push({
//           hubspotProductId,
//           stripeProductId,
//           stripePriceId
//         });
//         console.log(`✅ Found Stripe Product ID: ${stripeProductId}, Price ID: ${stripePriceId}`);
//         if (hasRecurringItem) {
//           console.log(
//             "🔄 Recurring product detected. Creating Stripe Subscription..."
//           );

//           // return await createStripeSubscription(lineItemsData, stripeAccessToken, hubspotProductId);
//         } else {
//           console.log(
//             "💰 All products are one-time purchases. Creating Stripe Invoice..."
//           );
//           // return await createStripeInvoice(amount, dealName, stripeAccessToken, hubspotProductId);
//         }
//       }
//     }

//     // // ✅ **CASE 2: Line Items Found - Check if Any are Recurring**
//     // if (hasRecurringItem) {
//     //   console.log("🔄 Recurring product detected. Creating Stripe Subscription...");
//     //   // return await createStripeSubscription(lineItemsData, stripeAccessToken);
//     // } else {
//     //   console.log("💰 All products are one-time purchases. Creating Stripe Invoice...");
//     //   // return await createStripeInvoice(amount, dealName, stripeAccessToken);
//     // }
//   } catch (error) {
//     console.error("❌ Error processing HubSpot deal:", error);
//   }
// };

// const processHubspotDealCreated = async (dealData, hubspotAccessToken) => {
//   try {
//     console.log("🔹 Raw HubSpot Deal Data:", JSON.stringify(dealData, null, 2));

//     // Extract main deal properties
//     const dealId = dealData.id;
//     const dealName = dealData.properties.dealname;
//     const amount = parseFloat(dealData.properties.amount) || 0;
//     const closeDate = dealData.properties.closedate;
//     const dealStage = dealData.properties.dealstage;
//     const dealType = dealData.properties.dealtype;
//     const priority = dealData.properties.hs_priority;
//     const pipeline = dealData.properties.pipeline;
//     const stripeCustomerIds: string[] = [];
//     const collectedProducts: { stripeProductId: string; stripePriceId: string }[] = [];

//     // Extract associated contacts (to get Stripe customer IDs)
//     let associatedContacts =
//       dealData.associations?.contacts?.results?.map((contact) => contact.id) || [];

//     // Extract associated line items (products)
//     let associatedLineItems =
//       dealData.associations?.["line items"]?.results?.map((item) => item.id) || [];

//     // ✅ **Fetch Stripe Customer IDs**
//     if (associatedContacts.length > 0) {
//       for (const contactId of associatedContacts) {
//         const stripeId = await fetchContactStripeId(contactId, hubspotAccessToken);
//         if (stripeId) {
//           stripeCustomerIds.push(stripeId);
//         }
//       }
//     }

//     // ✅ **CASE 1: No Line Items (Invoice for Amount)**
//     if (associatedLineItems.length === 0) {
//       console.log("💰 No line items found. Creating Stripe Invoice for amount:", amount);

//       if (stripeCustomerIds.length === 0) {
//         console.log("❌ No Customer found. Cannot create invoice.");
//         return null;
//       }

//       return {
//         dealId, // ✅ Include main deal ID
//         type: "invoice", // ✅ Invoice since there are no line items
//         customer: stripeCustomerIds, // ✅ Include customer IDs
//         amount, // ✅ Return amount
//       };
//     }

//     // ✅ **CASE 2: Line Items Found - Process Products**
//     let hasRecurringItem = false;
//     let lineItemsData = [] as any[];

//     for (const lineItemId of associatedLineItems) {
//       const lineItem = await fetchHubSpotLineItem(lineItemId, hubspotAccessToken);

//       if (lineItem) {
//         lineItemsData.push(lineItem);

//         // 🔹 Retrieve HubSpot Product ID from the line item
//         const hubspotProductId = lineItem.properties.hs_product_id || null;
//         console.log("🔍 HubSpot Product ID:", hubspotProductId);

//         if (!hubspotProductId) continue;

//         // 🔄 Check if this line item is recurring
//         switch (lineItem.properties.billing_frequency) {
//           case "weekly":
//           case "biweekly":
//           case "monthly":
//           case "quarterly":
//           case "per_six_months":
//           case "annually":
//           case "per_two_years":
//           case "per_three_years":
//           case "per_four_years":
//           case "per_five_years":
//             hasRecurringItem = true;
//             break;
//         }

//         console.log("🛠️ Processing product with ID:", hubspotProductId);

//         // 🔹 Fetch HubSpot Product Details (to get Stripe IDs)
//         const productDetails = await fetchProductandPricesById(hubspotProductId, hubspotAccessToken);

//         if (!productDetails) {
//           console.warn(`⚠️ No product details found for Product ID: ${hubspotProductId}`);
//           continue;
//         }

//         // ✅ Extract Stripe Product & Price IDs
//         const stripeProductId = productDetails.properties?.stripe_product_id || null;
//         const stripePriceId = productDetails.properties?.stripe_price_id || null;

//         if (stripeProductId && stripePriceId) {
//           collectedProducts.push({
//             stripeProductId,
//             stripePriceId,
//           });
//         }

//         console.log(`✅ Found Stripe Product ID: ${stripeProductId}, Price ID: ${stripePriceId}`);
//       }
//     }

//     // ✅ **CASE 2A: Recurring Products Found**
//     if (hasRecurringItem) {
//       console.log("🔄 Recurring product detected. Returning subscription data...");
//       return {
//         dealId, // ✅ Include main deal ID
//         type: "recurring", // ✅ Recurring subscription
//         customer: stripeCustomerIds, // ✅ Include customer IDs
//         products: collectedProducts, // ✅ Array of Stripe products & price IDs
//       };
//     }

//     // ✅ **CASE 2B: Only One-Time Products Found**
//     console.log("💰 All products are one-time purchases. Returning invoice data...");
//     return {
//       dealId, // ✅ Include main deal ID
//       type: "invoice", // ✅ One-time purchase = Invoice
//       customer: stripeCustomerIds, // ✅ Include customer IDs
//       products: collectedProducts, // ✅ Array of Stripe products & price IDs
//     };

//   } catch (error) {
//     console.error("❌ Error processing HubSpot deal:", error);
//     return null;
//   }
// };

// const processHubspotDealCreated = async (dealData, hubspotAccessToken) => {
//   try {
//     console.log("🔹 Raw HubSpot Deal Data:", JSON.stringify(dealData, null, 2));

//     // Extract main deal properties
//     const dealId = dealData.id;
//     const dealName = dealData.properties.dealname;
//     const amount = parseFloat(dealData.properties.amount) || 0;
//     const stripeCustomerIds: string[] = [];
//     const collectedProducts: {
//       stripeProductId: string;
//       stripePriceId: string;
//       billingFrequency: string;
//     }[] = [];

//     // Extract associated contacts
//     let associatedContacts =
//       dealData.associations?.contacts?.results?.map((contact) => contact.id) ||
//       [];

//     // Extract associated line items (products)
//     let associatedLineItems =
//       dealData.associations?.["line items"]?.results?.map((item) => item.id) ||
//       [];

//     // ✅ **Fetch Stripe Customer IDs**
//     if (associatedContacts.length > 0) {
//       for (const contactId of associatedContacts) {
//         const stripeId = await fetchContactStripeId(
//           contactId,
//           hubspotAccessToken
//         );
//         if (stripeId) {
//           stripeCustomerIds.push(stripeId);
//         }
//       }
//     }

//     // ✅ **CASE 1: No Line Items (Invoice for Amount)**
//     if (associatedLineItems.length === 0) {
//       return {
//         dealId,
//         type: "invoice",
//         customer: stripeCustomerIds,
//         amount,
//       };
//     }

//     // ✅ **CASE 2: Line Items Found - Fetch Products**
//     let hasRecurringItem = false;

//     for (const lineItemId of associatedLineItems) {
//       const lineItem = await fetchHubSpotLineItem(
//         lineItemId,
//         hubspotAccessToken
//       );

//       if (lineItem) {
//         const hubspotProductId = lineItem.properties.hs_product_id || null;

//         if (!hubspotProductId) continue;

//         console.log("🛠️ Fetching Product Details for:", hubspotProductId);

//         // ✅ Fetch Product Details (to get billing_frequency)
//         const productDetails = await fetchProductandPricesById(
//           hubspotProductId,
//           hubspotAccessToken
//         );
//         console.log("porpduct details are here "+ JSON.stringify(productDetails));
//         if (!productDetails) {
//           console.warn(
//             `⚠️ No product details found for Product ID: ${hubspotProductId}`
//           );
//           continue;
//         }

//         // ✅ Extract Stripe Product & Price IDs
//         const stripeProductId =
//           productDetails.properties?.stripe_product_id || null;
//         const stripePriceId =
//           productDetails.properties?.stripe_price_id || null;
//         const billingFrequency =
//           productDetails.properties?.billing_frequency || "one_time"; // Default to "one_time"

//         if (stripeProductId && stripePriceId) {
//           collectedProducts.push({
//             stripeProductId,
//             stripePriceId,
//             billingFrequency,
//           });
//         }

//         // ✅ Check if this product is recurring
//         const recurringBillingFrequencies = [
//           "weekly",
//           "biweekly",
//           "monthly",
//           "quarterly",
//           "per_six_months",
//           "annually",
//           "per_two_years",
//           "per_three_years",
//           "per_four_years",
//           "per_five_years",
//         ];
//         if (recurringBillingFrequencies.includes(billingFrequency)) {
//           hasRecurringItem = true;
//         }
//       }
//     }

//     // ✅ **CASE 2A: Recurring Products Found**
//     if (hasRecurringItem) {
//       return {
//         dealId,
//         type: "recurring",
//         customer: stripeCustomerIds,
//         products: collectedProducts,
//       };
//     }

//     // ✅ **CASE 2B: Only One-Time Products Found**
//     return {
//       dealId,
//       type: "invoice",
//       customer: stripeCustomerIds,
//       products: collectedProducts,
//     };
//   } catch (error) {
//     console.error("❌ Error processing HubSpot deal:", error);
//     return null;
//   }
// };

const processHubspotDealCreated = async (
  stripeaccesstoken,
  dealData,
  hubspotAccessToken
) => {
  try {
    console.log("🔹 Raw HubSpot Deal Data:", JSON.stringify(dealData, null, 2));

    const dealId = dealData.id;
    const dealName = dealData.properties.dealname;
    const amount = parseFloat(dealData.properties.amount) || 0;
    const stripeCustomerIds: string[] = [];
    const collectedProducts: {
      stripeProductId: string;
      stripePriceId: string;
      type: string;
      interval?: string;
      interval_count?: number;
      quantity: number;
    }[] = [];

    let associatedContacts =
      dealData.associations?.contacts?.results?.map((contact) => contact.id) ||
      [];

    let associatedLineItems =
      dealData.associations?.["line items"]?.results?.map((item) => item.id) ||
      [];

    // ✅ Fetch Stripe Customer IDs
    if (associatedContacts.length > 0) {
      for (const contactId of associatedContacts) {
        const stripeId = await fetchContactStripeId(
          contactId,
          hubspotAccessToken
        );
        if (stripeId) {
          stripeCustomerIds.push(stripeId);
        }
      }
    }

    // ✅ **CASE 1: No Line Items (Invoice for Amount)**
    if (associatedLineItems.length === 0) {
      return {
        dealId,
        type: "invoice",
        customer: stripeCustomerIds,
        amount,
      };
    }

    // ✅ **CASE 2: Line Items Found - Fetch Stripe Prices**
    let hasRecurringItem = false;

    for (const lineItemId of associatedLineItems) {
      const lineItem = await fetchHubSpotLineItem(
        lineItemId,
        hubspotAccessToken
      );

      if (lineItem) {
        const hubspotProductId = lineItem.properties.hs_product_id || null;
        const quantity = parseInt(lineItem.properties.quantity || "1", 10);
        if (!hubspotProductId) continue;

        console.log("🛠️ Fetching Product Details for:", hubspotProductId);

        // ✅ Fetch Product Details (including Stripe Price ID)
        const productDetails = await fetchProductandPricesById(
          hubspotProductId,
          hubspotAccessToken
        );

        if (!productDetails) {
          console.warn(
            `⚠️ No product details found for Product ID: ${hubspotProductId}`
          );
          continue;
        }

        // ✅ Extract Stripe Product & Price IDs
        const stripeProductId =
          productDetails.properties?.stripe_product_id || null;
        const stripePriceId =
          productDetails.properties?.stripe_price_id || null;

        if (stripeProductId && stripePriceId) {
          // ✅ Fetch Stripe Price Details to determine type (recurring or one-time)
          const stripePriceDetails = await fetchStripePriceDetails(
            stripeaccesstoken,
            stripePriceId
          );

          if (stripePriceDetails) {
            collectedProducts.push({
              stripeProductId,
              stripePriceId,
              type: stripePriceDetails.type, // ✅ "recurring" or "one_time"
              interval: stripePriceDetails.interval || "null", // ✅ Fetch interval
              interval_count: Number(stripePriceDetails.interval_count), // ✅ Fetch interval count
              quantity: quantity,
            });

            if (stripePriceDetails.type === "recurring") {
              hasRecurringItem = true;
            }
          }
        }
      }
    }

    // ✅ **CASE 2A: Recurring Products Found (Subscription)**
    if (hasRecurringItem) {
      return {
        dealId,
        type: "recurring",
        customer: stripeCustomerIds,
        products: collectedProducts,
      };
    }

    // ✅ **CASE 2B: Only One-Time Products Found (Invoice)**
    return {
      dealId,
      type: "invoice",
      customer: stripeCustomerIds,
      products: collectedProducts,
    };
  } catch (error) {
    console.error("❌ Error processing HubSpot deal:", error);
    return null;
  }
};

const checkHubSpotPropertyExists = async (hubspotAccessToken, propertyName) => {
  try {
    const url = `https://api.hubapi.com/crm/v3/properties/deals/${propertyName}`;
    await axios.get(url, {
      headers: {
        Authorization: `Bearer ${hubspotAccessToken}`,
        "Content-Type": "application/json",
      },
    });
    return true; // ✅ Property Exists
  } catch (error: any) {
    if (error.response?.status === 404) {
      return false; // ❌ Property Does Not Exist
    }
    console.error(
      `❌ Error checking property ${propertyName}:`,
      error.response?.data || error.message
    );
    return false;
  }
};

const createInvoiceAndSubscriptionIdsOnHubspot = async (hubspotAccessToken) => {
  try {
    const propertiesToCreate = [
      {
        name: "stripe_subscription_id",
        label: "Stripe Subscription ID",
        type: "string", // ✅ Ensure type is correctly set
        fieldType: "text",
        groupName: "dealinformation",
        description: "The Stripe Subscription ID associated with this deal",
        displayOrder: -1,
        hasUniqueValue: false,
        hidden: false,
        formField: true,
      },
      {
        name: "stripe_invoice_id",
        label: "Stripe Invoice ID",
        type: "string", // ✅ Ensure type is correctly set
        fieldType: "text",
        groupName: "dealinformation",
        description: "The Stripe Invoice ID associated with this deal",
        displayOrder: -1,
        hasUniqueValue: false,
        hidden: false,
        formField: true,
      },
    ];

    for (const property of propertiesToCreate) {
      const exists = await checkHubSpotPropertyExists(
        hubspotAccessToken,
        property.name
      );
      if (!exists) {
        console.log(`🛠️ Creating missing property: ${property.name}...`);
        const url = `https://api.hubapi.com/crm/v3/properties/deals`;
        const response = await axios.post(url, property, {
          headers: {
            Authorization: `Bearer ${hubspotAccessToken}`,
            "Content-Type": "application/json",
          },
        });
        console.log(`✅ Created HubSpot property: ${property.name}`);
        console.log(response.data);
      } else {
        console.log(
          `⚠️ Property already exists: ${property.name}, skipping creation.`
        );
      }
    }
  } catch (error: any) {
    console.error(
      "❌ Error creating HubSpot properties:",
      error.response?.data || error.message
    );
  }
};

const checkHubSpotDealProperties = async (hubspotAccessToken) => {
  try {
    const url = `https://api.hubapi.com/crm/v3/properties/deals`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${hubspotAccessToken}`,
        "Content-Type": "application/json",
      },
    });

    const existingProperties = response.data.results.map((prop) => prop.name);
    return (
      existingProperties.includes("stripe_subscription_id") &&
      existingProperties.includes("stripe_invoice_id")
    );
  } catch (error: any) {
    console.error(
      "❌ Error checking HubSpot deal properties:",
      error.response?.data || error.message
    );
    return false;
  }
};

const updateHubSpotDeal = async (
  dealId,
  subscriptionIds,
  invoiceIds,
  hubspotAccessToken
) => {
  console.log(`🔹 Processing HubSpot Deal Update for Deal ID: ${dealId}`);

  // Ensure properties exist before updating
  await createInvoiceAndSubscriptionIdsOnHubspot(hubspotAccessToken);

  try {
    const updateData = { properties: {} };

    if (subscriptionIds.length > 0) {
      updateData.properties["stripe_subscription_id"] =
        subscriptionIds.join(", ");
    }
    if (invoiceIds.length > 0) {
      updateData.properties["stripe_invoice_id"] = invoiceIds.join(", ");
    }
    // if (productIds.length > 0) {
    //   updateData.properties["stripe_product_id"] = productIds.join(", ");
    // }
    // if (priceIds.length > 0) {
    //   updateData.properties["stripe_price_id"] = priceIds.join(", ");
    // }

    if (Object.keys(updateData.properties).length === 0) {
      console.log(
        "⚠️ No subscription, invoice, product, or price ID to update."
      );
      return;
    }

    const url = `https://api.hubapi.com/crm/v3/objects/deals/${dealId}`;
    await axios.patch(url, updateData, {
      headers: {
        Authorization: `Bearer ${hubspotAccessToken}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`✅ Updated HubSpot deal ${dealId} with Stripe IDs`);
  } catch (error: any) {
    console.error(
      `❌ Error updating HubSpot deal ${dealId}:`,
      error.response?.data || error.message
    );
  }
};

//new code

const checkHubSpotCompanyProperty = async (hubspotAccessToken) => {
  try {
    const response = await axios.get(
      `https://api.hubapi.com/crm/v3/properties/companies/stripe_company_id`,
      {
        headers: {
          Authorization: `Bearer ${hubspotAccessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("✅ Property stripe_company_id exists.");
    return true;
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.warn("⚠️ Property stripe_company_id does not exist.");
      return false;
    }
    console.error(
      "❌ Error checking HubSpot property:",
      error.response?.data || error.message
    );
    return false;
  }
};

const createHubSpotCompanyProperty = async (hubspotAccessToken) => {
  try {
    const response = await axios.post(
      `https://api.hubapi.com/crm/v3/properties/companies`,
      {
        name: "stripe_company_id",
        label: "Stripe Company ID",
        type: "string",
        fieldType: "text",
        groupName: "companyinformation",
        description: "The Stripe Company ID associated with this company",
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

const fetchHubSpotCompany = async (companyId, hubspotAccessToken) => {
  try {
    const response = await axios.get(
      `https://api.hubapi.com/crm/v3/objects/companies/${companyId}?properties=annualrevenue,city,domain,createdate,description,name,country,zip,industry,type,numberofemployees,timezone,linkedincompanyprofile,companyOwner`,
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
    console.error("❌ Error fetching company details:", error.response.data);
    return null;
  }
};

const fetchCompanyStripeId = async (
  companyId: string,
  hubspotAccessToken: string
) => {
  try {
    const response = await axios.get(
      `https://api.hubapi.com/crm/v3/objects/companies/${companyId}?properties=stripe_company_id`,
      {
        headers: {
          Authorization: `Bearer ${hubspotAccessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Company Data Retrieved:", response.data);
    console.log(response.data?.properties?.stripe_company_id);
    return response.data?.properties?.stripe_company_id;
  } catch (error: any) {
    console.error(
      "❌ Error fetching company details:",
      error.response?.data || error.message
    );
    return null;
  }
};

const createHubSpotDealPropertyPaymentPaidDate = async (
  hubspotAccessToken: string
) => {
  try {
    const response = await axios.post(
      `https://api.hubapi.com/crm/v3/properties/deals`,
      {
        name: "payment_paid_date",
        label: "Payment Paid Date",
        type: "string",
        fieldType: "text",
        groupName: "dealinformation",
        description: "The date the payment was paid",
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

    console.log(
      "✅ Custom Property `payment_paid_date` Created:",
      response.data
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "❌ Error creating HubSpot deal property:",
      error.response?.data || error.message
    );
  }
};

const updateHubSpotCompany = async (
  companyId,
  stripeCompanyId,
  hubspotAccessToken
) => {
  try {
    const companyExists = await checkHubSpotCompanyProperty(hubspotAccessToken);
    if (!companyExists) {
      console.log("🛠️ Creating missing property: stripe_company_id...");
      await createHubSpotCompanyProperty(hubspotAccessToken);
    }

    const response = await axios.patch(
      `https://api.hubapi.com/crm/v3/objects/companies/${companyId}`,
      { properties: { stripe_company_id: stripeCompanyId } },
      {
        headers: {
          Authorization: `Bearer ${hubspotAccessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ HubSpot Company Updated with Stripe ID:", response.data);
    return response.data;
  } catch (error: any) {
    console.error(
      "❌ Error updating HubSpot company:",
      error.response?.data || error.message
    );
  }
};

const updateHubSpotDealPaymentStatus = async (
  dealId,
  paymentStatus,
  paymentPaidDate,
  hubspotAccessToken
) => {
  console.log("🚀 => dealId:", dealId);
  try {
    const response = await axios.patch(
      `https://api.hubapi.com/crm/v3/objects/deals/${dealId}`,
      {
        properties: {
          payment_status: paymentStatus,
          payment_paid_date: paymentPaidDate,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${hubspotAccessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ HubSpot Deal Updated with Payment Status:", response.data);
    return response.data;
  } catch (error: any) {
    console.error(
      "❌ Error updating HubSpot deal:",
      error.response?.data || error.message
    );
  }
};

export {
  updateHubSpotContact,
  fetchHubSpotContact,
  fetchContactStripeId,
  fetchProduct,
  updateHubSpotProduct,
  fetchProductById,
  fetchDealById,
  fetchHubSpotLineItem,
  fetchHubSpotCompany,
  updateHubSpotCompany,
  fetchCompanyStripeId,
  createHubSpotDealPropertyPaymentPaidDate,
  updateHubSpotDeal,
  updateHubSpotDealPaymentStatus
};
