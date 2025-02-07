import Stripe from "stripe";
import {
  fetchHubSpotContact,
  fetchHubSpotLineItem,
} from "../hubspotActions/hubspotActions";

const stripeInstance = (stripeAccessToken: string) => {
  return new Stripe(stripeAccessToken, {
    apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
  });
};

// ✅ Function to Create Stripe Customer
const createStripeCustomer = async (contact, stripeAccessToken, contactId) => {
  console.log(contact);
  try {
    const stripe = new Stripe(stripeAccessToken as string, {
      apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
    });

    const customer = await stripe.customers.create({
      name: `${contact.properties.firstname || ""} ${
        contact.properties.lastname || ""
      }`,
      email: contact.properties.email || "",
      phone: contact.properties.phone || "",
      metadata: {
        hubspot_contact_id: contactId, // ✅ Adding HubSpot Contact ID
        deleted: "false",
      },
    });

    console.log("✅ Stripe Customer Created:", customer.id);
    return customer.id;
  } catch (error) {
    console.error("Error creating Stripe customer:", error);
    return null;
  }
};

const updateStripeCustomer = async (
  stripeAccessToken,
  propertyName,
  propertyValue,
  customerId
) => {
  try {
    const stripeUpdateFields = {
      firstname: "name",
      lastname: "name",
      email: "email",
      phone: "phone",
      company: "metadata.company",
      website: "metadata.website",
      address: "address.line1",
      city: "address.city",
      state: "address.state",
      zip: "address.postal_code",
      country: "address.country",
      industry: "metadata.industry",
      hubspot_owner_id: "metadata.hubspot_owner_id",
      lead_status: "metadata.lead_status",
      customer_notes: "metadata.notes",
      deleted: "metadata.deleted",
      hs_lead_status: "metadata.lead_status",
    };

    let updateData: Record<string, any> = {
      metadata: {}, // Ensure metadata exists
      address: {}, // Ensure address exists
    };

    if (propertyName in stripeUpdateFields) {
      const stripeField = stripeUpdateFields[propertyName];

      if (stripeField.startsWith("metadata.")) {
        const metadataKey = stripeField.split(".")[1];
        updateData.metadata[metadataKey] = propertyValue;
      } else if (stripeField.startsWith("address.")) {
        updateData.address[stripeField.split(".")[1]] = propertyValue;
      } else {
        updateData[stripeField] = propertyValue;
      }
    }

    // Remove empty objects to avoid errors in the API request
    if (Object.keys(updateData.metadata).length === 0)
      delete updateData.metadata;
    if (Object.keys(updateData.address).length === 0) delete updateData.address;

    const stripe = new Stripe(stripeAccessToken as string, {
      apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
    });

    const customerUpdate = await stripe.customers.update(
      customerId,
      updateData
    );
  } catch (error) {
    console.error("Error updating Stripe customer:", error);
  }
};

const createProduct = async (stripeAccessToken, productData) => {
  try {
    const { id, properties } = productData || {}; // Default to an empty object if productData is undefined

    const {
      name = null,
      price = null,
      sku = null,
      description = null,
      billing_frequency = null, // Monthly, Yearly, One-time
      createdate = null,
      hs_lastmodifieddate = null,
    } = properties || {};

    // Convert price to cents (Stripe expects amounts in cents)
    const priceInCents = Math.round(parseFloat(price) * 100);

    // Determine billing frequency for Stripe pricing
    let stripeRecurring: Stripe.PriceCreateParams.Recurring | undefined;

    if (billing_frequency) {
      switch (billing_frequency.toLowerCase()) {
        case "weekly":
          stripeRecurring = { interval: "week", interval_count: 1 };
          break;

        case "biweekly":
          stripeRecurring = { interval: "week", interval_count: 2 };
          break;

        case "monthly":
          stripeRecurring = { interval: "month", interval_count: 1 };
          break;

        case "quarterly":
          stripeRecurring = { interval: "month", interval_count: 3 };
          break;

        case "per_six_months":
          stripeRecurring = { interval: "month", interval_count: 6 };
          break;

        case "annually":
          stripeRecurring = { interval: "year", interval_count: 1 };
          break;

        case "per_two_years":
          stripeRecurring = { interval: "year", interval_count: 2 };
          break;

        case "per_three_years":
          stripeRecurring = { interval: "year", interval_count: 3 };
          break;

        case "per_four_years":
          stripeRecurring = { interval: "year", interval_count: 4 };
          break;

        case "per_five_years":
          stripeRecurring = { interval: "year", interval_count: 5 };
          break;

        default:
          console.warn(
            `⚠️ Unknown billing frequency: ${billing_frequency}. Defaulting to one-time payment.`
          );
          stripeRecurring = undefined; // One-time payment
      }
    }

    const stripe = new Stripe(stripeAccessToken as string, {
      apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
    });
    // 🔹 Step 3: Create Product in Stripe
    const stripeProduct = await stripe.products.create({
      name,
      description,
      metadata: {
        hubspot_product_id: id,
        hubspot_sku: sku || "N/A",
        hubspot_created_at: createdate || "N/A",
        hubspot_last_modified: hs_lastmodifieddate || "N/A",
        hubspot_billing_frequency: billing_frequency || "one-time",
        deleted: "false",
      },
    });

    // 🔹 Step 4: Create Price in Stripe (Recurring or One-time)
    const stripePrice = await stripe.prices.create({
      unit_amount: priceInCents,
      currency: "usd", // Modify as needed
      product: stripeProduct.id,
      recurring: stripeRecurring || undefined, // If null, it will be one-time
      metadata: {
        deleted: "false",
      },
    });

    console.log("✅ Stripe Product Created:", stripeProduct.id);
    console.log("✅ Stripe Price Created:", stripePrice.id);
    const productId = stripeProduct.id;
    const priceId = stripePrice.id;
    return { productId, priceId };
  } catch (error) {
    console.error("Error creating product:", error);
  }
};

const updateStripeProduct = async (
  stripeAccessToken: string,
  propertyName: string,
  propertyValue: string,
  productId: string
) => {
  try {
    const stripe = new Stripe(stripeAccessToken as string, {
      apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
    });

    console.log(
      `🔹 Updating Stripe product: ${productId} for ${propertyName}...`
    );

    // Fetch existing product
    const existingProduct = await stripe.products.retrieve(productId);

    // Initialize update object
    let updateData: Stripe.ProductUpdateParams = {};
    let metadataUpdate: Record<string, string> = existingProduct.metadata || {};
    let stripePriceId = null as any;
    // 🔹 Handle Standard Stripe Fields
    switch (propertyName) {
      case "name":
        updateData.name = propertyValue;
        break;

      case "description":
        updateData.description = propertyValue;
        break;
      case "price":
        console.log(`⏳ Updating Stripe price for product: ${productId}...`);
        stripePriceId = await updateStripePricamount(
          stripe,
          productId,
          propertyValue
        );
        return { price_id: stripePriceId };

      case "recurringbillingfrequency":
        console.log(
          `⏳ Updating Stripe price due to billing frequency change: ${propertyValue}`
        );
        stripePriceId = await updateStripePricing(
          stripe,
          productId,
          propertyValue
        );
        return { price_id: stripePriceId }; // Pricing handled separately, exit function

      default:
        // If property is not a standard Stripe field, update it in metadata
        metadataUpdate[propertyName] = propertyValue;
    }

    // Include metadata update if any
    if (Object.keys(metadataUpdate).length > 0) {
      updateData.metadata = metadataUpdate;
    }

    // 🔹 Update the product in Stripe
    const updatedProduct = await stripe.products.update(productId, updateData);
    console.log("✅ Stripe Product Updated:", updatedProduct);

    if (stripePriceId) {
      return { price_id: stripePriceId };
    } else {
      return { price_id: null };
    }
  } catch (error) {
    console.error("❌ Error updating Stripe product:", error);
  }
};

const updateStripePricing = async (
  stripe: Stripe,
  productId: string,
  billing_frequency: string
) => {
  try {
    console.log(
      `🔄 Updating pricing for product: ${productId} to ${billing_frequency}`
    );

    let stripeRecurring: Stripe.PriceCreateParams.Recurring | undefined;

    switch (billing_frequency.toLowerCase()) {
      case "weekly":
        console.log("Weekly");
        stripeRecurring = { interval: "week", interval_count: 1 };
        break;
      case "biweekly":
        stripeRecurring = { interval: "week", interval_count: 2 };
        break;
      case "monthly":
        stripeRecurring = { interval: "month", interval_count: 1 };
        break;
      case "quarterly":
        stripeRecurring = { interval: "month", interval_count: 3 };
        break;
      case "per_six_months":
        stripeRecurring = { interval: "month", interval_count: 6 };
        break;
      case "annually":
        stripeRecurring = { interval: "year", interval_count: 1 };
        break;
      case "per_two_years":
        stripeRecurring = { interval: "year", interval_count: 2 };
        break;
      case "per_three_years":
        stripeRecurring = { interval: "year", interval_count: 3 };
        break;
      case "per_four_years":
        stripeRecurring = { interval: "year", interval_count: 4 };
        break;
      case "per_five_years":
        stripeRecurring = { interval: "year", interval_count: 5 };
        break;
      default:
        console.warn(
          `⚠️ Unknown billing frequency: ${billing_frequency}. Skipping update.`
        );
        return;
    }

    // Get the current price object for the product
    const prices = await stripe.prices.list({
      product: productId,
      active: true,
    });

    console.log("These are the prices" + JSON.stringify(prices, null, 2));
    // If a price exists, deactivate the old one
    if (prices.data.length > 0) {
      const currentPriceId = prices.data[0].id;
      await stripe.prices.update(currentPriceId, { active: false });
      console.log(`🔴 Deactivated old price: ${currentPriceId}`);
    }

    // Create a new price with the updated recurring frequency
    const newPrice = await stripe.prices.create({
      unit_amount: prices.data[0]?.unit_amount || 1000, // Retain previous price amount
      currency: prices.data[0]?.currency || "usd",
      product: productId,
      recurring: stripeRecurring,
    });

    console.log(`✅ New Stripe Price Created: ${newPrice.id}`);
    return newPrice.id;
  } catch (error) {
    console.error("❌ Error updating Stripe pricing:", error);
  }
};

const updateStripePricamount = async (
  stripe: Stripe,
  productId: string,
  newPrice: string
) => {
  try {
    const newPriceInCents = parseInt(newPrice) * 100; // Convert to cents
    console.log(`🔹 Fetching existing prices for product ${productId}...`);

    // Fetch the existing active price(s)
    const prices = await stripe.prices.list({
      product: productId,
      active: true,
    });

    if (prices.data.length === 0) {
      console.warn(
        `⚠️ No active price found for product ${productId}. Creating a new one.`
      );
    }

    // Use the most recent active price as a reference
    const oldPrice = prices.data[0] ?? {};

    // ✅ Copy all attributes except `unit_amount`
    const newPriceData: Stripe.PriceCreateParams = {
      unit_amount: newPriceInCents,
      currency: oldPrice.currency || "usd", // Keep same currency, default to "usd"
      product: productId,
      recurring: oldPrice.recurring
        ? {
            interval: oldPrice.recurring.interval,
            interval_count: oldPrice.recurring.interval_count ?? 1, // Default to 1
            usage_type: oldPrice.recurring.usage_type ?? "licensed", // Default value
            aggregate_usage: oldPrice.recurring.aggregate_usage ?? undefined, // Optional
          }
        : undefined, // Fix: Ensure correct type

      metadata: oldPrice.metadata ?? {}, // Copy metadata
      tax_behavior: oldPrice.tax_behavior ?? "unspecified", // Copy tax behavior
      billing_scheme: oldPrice.billing_scheme ?? "per_unit", // Copy billing scheme
      tiers_mode: oldPrice.tiers_mode ?? undefined, // Fix
      transform_quantity: oldPrice.transform_quantity ?? undefined, // Fix
      nickname: oldPrice.nickname ?? undefined, // Fix
    };

    console.log(
      `🔹 Creating a new price for product ${productId} with updated amount...`
    );

    // ✅ Create new price with copied attributes
    const newPriceObj = await stripe.prices.create(newPriceData);

    console.log(
      `✅ New price created: ${newPriceObj.id} (Amount: ${newPriceObj.unit_amount} cents)`
    );

    // ✅ Deactivate old price(s)
    for (const price of prices.data) {
      if (price.id !== newPriceObj.id) {
        await stripe.prices.update(price.id, { active: false });
        console.log(`❌ Deactivated old price: ${price.id}`);
      }
    }

    return newPriceObj.id;
  } catch (error) {
    console.error("❌ Error updating Stripe price:", error);
    return null;
  }
};

const fetchStripePriceDetails = async (stripeAccessToken, priceId) => {
  try {
    const stripe = new Stripe(stripeAccessToken as string, {
      apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
    });
    const price = await stripe.prices.retrieve(priceId);
    console.log(`✅ Stripe Price Details for ${priceId}:`, price);
    console.log(JSON.stringify(price));
    return {
      priceId: price.id,
      productId: price.product,
      type: price.recurring ? "recurring" : "one_time",
      interval: price.recurring?.interval, // ✅ Use this to decide invoice or subscription
      interval_count: price.recurring?.interval_count, // If recurring, store interval
    };
  } catch (error) {
    console.error(`❌ Error fetching Stripe price for ${priceId}:`, error);
    return null;
  }
};

// const processStripePayments = async (dealData, stripeAccessToken) => {
//   try {
//     console.log("🔹 Processing Stripe Payments:", JSON.stringify(dealData, null, 2));

//     const { dealId, type, customer, products } = dealData;

//     for (const customerId of customer) {
//       console.log(`✅ Processing for Customer: ${customerId}`);

//       if (type === "invoice" || type === "one_time") {
//         // ✅ Create a one-time invoice
//         const invoice = await createStripeInvoice(customerId, products, stripeAccessToken);
//         if (invoice) {
//           console.log(`💰 Invoice created for Customer ${customerId}: ${invoice.id}`);
//         } else {
//           console.error(`❌ Failed to create invoice for Customer ${customerId}`);
//         }
//       } else if (type === "recurring") {
//         // ✅ Create a recurring subscription
//         const subscription = await createStripeSubscription(customerId, products, stripeAccessToken);
//         if (subscription) {
//           console.log(`🔄 Subscription created for Customer ${customerId}: ${subscription.id}`);
//         } else {
//           console.error(`❌ Failed to create subscription for Customer ${customerId}`);
//         }
//       }
//     }
//   } catch (error) {
//     console.error("❌ Error processing Stripe payments:", error);
//   }
// };

// const createStripeInvoice = async (customerId, products, stripeAccessToken) => {
//   try {
//     const invoiceItems = [] as any[];
//     const stripe = new Stripe(stripeAccessToken as string, {
//       apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
//     });
//     // ✅ Loop through products and add them as invoice items
//     for (const product of products) {
//       if (product.type === "one_time") {
//         const invoiceItem = await stripe.invoiceItems.create({
//           customer: customerId,
//           price: product.stripePriceId, // Price ID from Stripe
//         });
//         invoiceItems.push(invoiceItem);
//       }
//     }

//     // ✅ Create the invoice
//     const invoice = await stripe.invoices.create({
//       customer: customerId,
//       auto_advance: true, // Auto-finalize invoice
//     });

//     // ✅ Finalize invoice to send it
//     const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
//     return finalizedInvoice;
//   } catch (error) {
//     console.error(`❌ Error creating invoice for customer ${customerId}:`, error);
//     return null;
//   }
// };

// const createStripeSubscription = async (customerId, products, stripeAccessToken) => {
//   try {
//     const subscriptionItems = [] as any[];

//     // ✅ Loop through products and add them as subscription items
//     for (const product of products) {
//       if (product.type === "recurring") {
//         subscriptionItems.push({
//           price: product.stripePriceId, // Recurring Price ID from Stripe
//           quantity: 1,
//         });
//       }
//     }
//     const stripe = new Stripe(stripeAccessToken as string, {
//       apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
//     });
//     // ✅ Create a subscription
//     const subscription = await stripe.subscriptions.create({
//       customer: customerId,
//       items: subscriptionItems,
//       expand: ["latest_invoice.payment_intent"], // Include invoice details in response
//     });

//     return subscription;
//   } catch (error) {
//     console.error(`❌ Error creating subscription for customer ${customerId}:`, error);
//     return null;
//   }
// };

// const processStripePayments = async (dealData, stripeAccessToken) => {
//   try {
//     console.log(
//       "🔹 Processing Stripe Payments:",
//       JSON.stringify(dealData, null, 2)
//     );

//     const { dealId, type, customer, products } = dealData;

//     for (const customerId of customer) {
//       console.log(`✅ Processing for Customer: ${customerId}`);

//       if (type === "invoice" || type === "one_time") {
//         // ✅ Create a one-time invoice
//         const invoice = await createStripeInvoice(
//           customerId,
//           products,
//           stripeAccessToken
//         );
//         if (invoice) {
//           console.log(
//             `💰 Invoice created for Customer ${customerId}: ${invoice.id}`
//           );
//         } else {
//           console.error(
//             `❌ Failed to create invoice for Customer ${customerId}`
//           );
//         }
//       } else if (type === "recurring") {
//         // ✅ First, check if the customer has a payment method
//         const hasPayment = await hasPaymentMethod(
//           customerId,
//           stripeAccessToken
//         );

//         if (hasPayment) {
//           // ✅ Create a recurring subscription if the customer has a payment method
//           const subscription = await createStripeSubscription(
//             customerId,
//             products,
//             stripeAccessToken
//           );
//           if (subscription) {
//             console.log(
//               `🔄 Subscription created for Customer ${customerId}: ${subscription.id}`
//             );
//           } else {
//             console.error(
//               `❌ Failed to create subscription for Customer ${customerId}`
//             );
//           }
//         } else {
//           // ❌ No payment method -> Use Subscription with `send_invoice`
//           console.log(
//             `📩 No payment method found for ${customerId}. Creating subscription with invoice.`
//           );
//           const subscriptionWithInvoice = await createSubscriptionWithInvoice(
//             customerId,
//             products,
//             stripeAccessToken
//           );
//           if (subscriptionWithInvoice) {
//             console.log(
//               `📩 Subscription with invoice created for Customer ${customerId}: ${subscriptionWithInvoice.id}`
//             );
//           } else {
//             console.error(
//               `❌ Failed to create subscription with invoice for Customer ${customerId}`
//             );
//           }
//         }
//       }
//     }
//   } catch (error) {
//     console.error("❌ Error processing Stripe payments:", error);
//   }
// };

// const processStripePayments = async (dealData, stripeAccessToken) => {
//   try {
//     console.log("🔹 Processing Stripe Payments:", JSON.stringify(dealData, null, 2));

//     const { dealId, type, customer, products, amount } = dealData;

//     for (const customerId of customer) {
//       console.log(`✅ Processing for Customer: ${customerId}`);

//       if ((!products || products.length === 0) && type === "invoice") {
//         // ✅ No Stripe products, create an invoice manually
//         console.log(`📩 No Stripe products found. Creating a manual invoice for ${amount}...`);
//         const invoice = await createManualInvoice(customerId, amount, stripeAccessToken);
//         if (invoice) {
//           console.log(`📩 Invoice created for Customer ${customerId}: ${invoice.id}`);
//         } else {
//           console.error(`❌ Failed to create invoice for Customer ${customerId}`);
//         }
//       } else if (type === "invoice" || type === "one_time") {
//         // ✅ Create a one-time invoice with products
//         const invoice = await createStripeInvoice(customerId, products, stripeAccessToken);
//         if (invoice) {
//           console.log(`💰 Invoice created for Customer ${customerId}: ${invoice.id}`);
//         } else {
//           console.error(`❌ Failed to create invoice for Customer ${customerId}`);
//         }
//       } else if (type === "recurring") {
//         // ✅ First, check if the customer has a payment method
//         const hasPayment = await hasPaymentMethod(customerId, stripeAccessToken);

//         if (hasPayment) {
//           // ✅ Create a recurring subscription if the customer has a payment method
//           const subscription = await createStripeSubscription(customerId, products, stripeAccessToken);
//           if (subscription) {
//             console.log(`🔄 Subscription created for Customer ${customerId}: ${subscription.id}`);
//           } else {
//             console.error(`❌ Failed to create subscription for Customer ${customerId}`);
//           }
//         } else {
//           // ❌ No payment method -> Use Subscription with `send_invoice`
//           console.log(`📩 No payment method found for ${customerId}. Creating subscription with invoice.`);
//           const subscriptionWithInvoice = await createSubscriptionWithInvoice(customerId, products, stripeAccessToken);
//           if (subscriptionWithInvoice) {
//             console.log(`📩 Subscription with invoice created for Customer ${customerId}: ${subscriptionWithInvoice.id}`);
//           } else {
//             console.error(`❌ Failed to create subscription with invoice for Customer ${customerId}`);
//           }
//         }
//       }
//     }
//   } catch (error) {
//     console.error("❌ Error processing Stripe payments:", error);
//   }
// };

const processStripePayments = async (dealData, stripeAccessToken) => {
  try {
    console.log(
      "🔹 Processing Stripe Payments:",
      JSON.stringify(dealData, null, 2)
    );

    const { dealId, customer, products, amount } = dealData;

    // ✅ Explicitly define responseData with correct types
    const responseData: {
      dealId: string;
      invoices: string[];
      subscriptions: string[];
    } = {
      dealId: dealId,
      invoices: [],
      subscriptions: [],
    };

    for (const customerId of customer) {
      console.log(`✅ Processing for Customer: ${customerId}`);

      if (!products) {
        console.log(
          `📩 No Stripe products found for ${customerId}. Creating a manual invoice for ${amount}...`
        );
        const manualInvoice = await createManualInvoice(
          customerId,
          amount,
          stripeAccessToken,
          dealId
        );
        if (manualInvoice) {
          console.log(
            `📩 Manual invoice created for Customer ${customerId}: ${manualInvoice.id}`
          );
          responseData.invoices.push(manualInvoice.id); // ✅ Collect Manual Invoice ID
          return responseData;
        } else {
          console.error(
            `❌ Failed to create manual invoice for Customer ${customerId}`
          );
        }
      }

      // ✅ Separate one-time and recurring products
      const oneTimeProducts = products.filter(
        (product) => product.type === "one_time"
      );
      const recurringProducts = products.filter(
        (product) => product.type === "recurring"
      );

      // ✅ Process One-Time Products (Invoice)
      if (oneTimeProducts.length > 0) {
        console.log(
          `💰 Customer ${customerId} has one-time products. Creating invoice...`
        );
        const invoice = await createStripeInvoice(
          customerId,
          oneTimeProducts,
          stripeAccessToken,
          dealId
        );
        if (invoice) {
          console.log(
            `📩 Invoice created for Customer ${customerId}: ${invoice.id}`
          );
          responseData.invoices.push(invoice.id); // ✅ Collect Invoice ID
        } else {
          console.error(
            `❌ Failed to create invoice for Customer ${customerId}`
          );
        }
      }

      // ✅ Process Recurring Products (Subscription)
      if (recurringProducts.length > 0) {
        console.log(
          `🔄 Customer ${customerId} has recurring products. Checking payment method...`
        );

        const hasPayment = await hasPaymentMethod(
          customerId,
          stripeAccessToken
        );
        if (hasPayment) {
          // ✅ Customer has a payment method → Create subscription
          console.log(
            `✅ Customer ${customerId} has a payment method. Creating subscription...`
          );
          const subscription = await createStripeSubscription(
            customerId,
            recurringProducts,
            stripeAccessToken,
            dealId
          );
          if (subscription) {
            console.log(
              `🔄 Subscription created for Customer ${customerId}: ${subscription.id}`
            );
            responseData.subscriptions.push(subscription.id); // ✅ Collect Subscription ID
          } else {
            console.error(
              `❌ Failed to create subscription for Customer ${customerId}`
            );
          }
        } else {
          console.log(
            `📩 No payment method found for ${customerId}. Creating subscription with invoice.`
          );
          const subscriptionWithInvoice = (await createSubscriptionWithInvoice(
            customerId,
            recurringProducts,
            stripeAccessToken,
            dealId
          )) as
            | { subscriptionId: string; invoiceId: string | null }
            | { subscriptionId: string; invoiceId: string | null }[];

          if (subscriptionWithInvoice) {
            console.log(
              `📩 Subscription with invoice created for Customer ${customerId}`
            );

            if (!responseData.subscriptions) {
              responseData.subscriptions = [];
            }
            if (!responseData.invoices) {
              responseData.invoices = [];
            }

            // ✅ If the response is an array, loop through and collect IDs
            if (Array.isArray(subscriptionWithInvoice)) {
              subscriptionWithInvoice.forEach((sub) => {
                responseData.subscriptions.push(sub.subscriptionId);
                if (sub.invoiceId) {
                  responseData.invoices.push(sub.invoiceId);
                }
              });
            } else {
              // ✅ If it's a single subscription, push the IDs
              responseData.subscriptions.push(
                subscriptionWithInvoice.subscriptionId
              );
              if (subscriptionWithInvoice.invoiceId) {
                responseData.invoices.push(subscriptionWithInvoice.invoiceId);
              }
            }
          } else {
            console.error(
              `❌ Failed to create subscription with invoice for Customer ${customerId}`
            );
          }
        }
      }

      // ✅ Handle Case Where No Stripe Products Exist
      if (products.length == 0) {
        console.log(
          `📩 No Stripe products found for ${customerId}. Creating a manual invoice for ${amount}...`
        );
        const manualInvoice = await createManualInvoice(
          customerId,
          amount,
          stripeAccessToken,
          dealId
        );
        if (manualInvoice) {
          console.log(
            `📩 Manual invoice created for Customer ${customerId}: ${manualInvoice.id}`
          );
          responseData.invoices.push(manualInvoice.id); // ✅ Collect Manual Invoice ID
        } else {
          console.error(
            `❌ Failed to create manual invoice for Customer ${customerId}`
          );
        }
      }
    }

    // ✅ Return all collected invoice and subscription IDs
    return responseData;
  } catch (error) {
    console.error("❌ Error processing Stripe payments:", error);
    return null;
  }
};

/**
 * Creates a Stripe Invoice for customers when no Stripe products exist.
 * @param {string} customerId - Stripe Customer ID
 * @param {number} amount - Invoice total amount
 * @param {string} stripeAccessToken - Stripe API Key
 */
const createManualInvoice = async (
  customerId,
  amount,
  stripeAccessToken,
  dealId
) => {
  console.log("inside manual");
  console.log(amount + " amount before " + typeof amount);
  amount = Number(amount);
  try {
    const stripe = await stripeInstance(stripeAccessToken);

    // ✅ Step 1: Create an Invoice Item
    const invoiceItem = await stripe.invoiceItems.create({
      customer: customerId,
      amount: Math.round(amount * 100), // Stripe expects amounts in cents
      currency: "usd",
      description: `Invoice for Deal ID`,
      metadata: {
        // ✅ Add metadata to individual invoice items
        deal_id: dealId,
      },
    });

    console.log(
      `📄 Invoice item created for Customer ${customerId}: ${invoiceItem.id}`
    );

    // ✅ Step 2: Create the Invoice
    const invoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: "send_invoice", // ✅ Sends invoice instead of charging automatically
      days_until_due: 7, // ✅ Invoice is due in 7 days
      auto_advance: true, // ✅ Finalize invoice immediately
    });

    console.log(
      `📩 Manual invoice created for Customer ${customerId}: ${invoice.id}`
    );
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
    console.log(
      `📨 Invoice finalized and sent immediately: ${finalizedInvoice.id}`
    );
    return invoice;
  } catch (error) {
    console.error(
      `❌ Error creating manual invoice for customer ${customerId}:`,
      error
    );
    return null;
  }
};

const hasPaymentMethod = async (customerId, stripeAccessToken) => {
  try {
    const stripe = stripeInstance(stripeAccessToken);
    const customer = await stripe.customers.retrieve(customerId);

    if (
      "invoice_settings" in customer &&
      customer.invoice_settings?.default_payment_method
    ) {
      console.log(`✅ Customer ${customerId} has a default payment method.`);
      return true;
    }

    console.log(`⚠️ Customer ${customerId} has NO default payment method.`);
    return false;
  } catch (error) {
    console.error(
      `❌ Error checking payment method for customer ${customerId}:`,
      error
    );
    return false;
  }
};

const createStripeInvoice = async (
  customerId,
  products,
  stripeAccessToken,
  dealId
) => {
  console.log("inside create striep Invoice");
  try {
    const stripe = stripeInstance(stripeAccessToken);
    const invoiceItems = [] as any[];

    for (const product of products) {
      if (product.type === "one_time" || product.type === "recurring") {
        const invoiceItem = await stripe.invoiceItems.create({
          customer: customerId,
          price: product.stripePriceId,
          quantity: product.quantity,
          metadata: {
            // ✅ Add metadata to individual invoice items
            deal_id: dealId,
            product_id: product.stripeProductId,
          },
        });
        invoiceItems.push(invoiceItem);
      }
    }

    const invoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: "send_invoice",
      days_until_due: 7, // Send invoice instead of charging automatically
      auto_advance: true, // Let Stripe send the invoice
    });

    console.log(`📩 Invoice created for Customer ${customerId}: ${invoice.id}`);

    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
    console.log(
      `📨 Invoice finalized and sent immediately: ${finalizedInvoice.id}`
    );
    return invoice;
  } catch (error) {
    console.error(
      `❌ Error creating invoice for customer ${customerId}:`,
      error
    );
    return null;
  }
};

const createStripeSubscription = async (
  customerId,
  products,
  stripeAccessToken,
  dealId
) => {
  try {
    console.log("inside createStripeSubscription");
    const stripe = stripeInstance(stripeAccessToken);
    const subscriptionItems = products
      .filter((product) => product.type === "recurring")
      .map((product) => ({
        price: product.stripePriceId,
        quantity: product.quantity,
      }));

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: subscriptionItems,
      expand: ["latest_invoice.payment_intent"],
      metadata: {
        // ✅ Add metadata to subscription
        deal_id: dealId,
        created_by: "HubSpot Integration",
      },
    });

    console.log(
      `🔄 Subscription created for customer ${customerId}: ${subscription.id}`
    );
    return subscription;
  } catch (error) {
    console.error(
      `❌ Error creating subscription for customer ${customerId}:`,
      error
    );
    return null;
  }
};

// const createSubscriptionWithInvoice = async (
//   customerId,
//   products,
//   stripeAccessToken
// ) => {
//   try {
//     console.log("inside createSubscriptionWithInvoice");
//     const stripe = stripeInstance(stripeAccessToken);

//     const subscriptionItems = products
//       .filter((product) => product.type === "recurring")
//       .map((product) => ({ price: product.stripePriceId, quantity: 1 }));

//     const subscription = await stripe.subscriptions.create({
//       customer: customerId,
//       items: subscriptionItems,
//       collection_method: "send_invoice", // ✅ Sends an invoice instead of charging
//       days_until_due: 7, // ✅ Invoice is due in 7 days
//       expand: ["latest_invoice.payment_intent"],
//     });

//     console.log(
//       `📩 Subscription with invoice created for customer ${customerId}: ${subscription.id}`
//     );
//     // ✅ Step 2: Extract Invoice ID Safely
//     let invoiceId: string | null = null;

//     if (typeof subscription.latest_invoice === "string") {
//       invoiceId = subscription.latest_invoice; // ✅ It's already an ID
//     } else if (
//       subscription.latest_invoice &&
//       "id" in subscription.latest_invoice
//     ) {
//       invoiceId = subscription.latest_invoice.id; // ✅ Extract ID from object
//     }
//     // ✅ Step 2: Immediately finalize the invoice
//     if (subscription.latest_invoice) {
//       if (invoiceId) {
//         const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoiceId);
//         console.log(
//           `📨 Invoice finalized and sent immediately: ${finalizedInvoice.id}`
//         );
//       } else {
//         console.warn("⚠️ No invoice found for subscription.");
//       }

//     } else {
//       console.warn("⚠️ No invoice found for subscription.");
//     }
//     return subscription;
//   } catch (error) {
//     console.error(
//       `❌ Error creating subscription with invoice for customer ${customerId}:`,
//       error
//     );
//     return null;
//   }
// };

// const createSubscriptionWithInvoice = async (customerId, products, stripeAccessToken, dealId) => {
//   try {
//     console.log("inside createSubscriptionWithInvoice");
//     const stripe = stripeInstance(stripeAccessToken);

//     // ✅ Step 1: Group products by `interval` and `interval_count`
//     const groupedProducts: Record<string, Stripe.SubscriptionCreateParams.Item[]> = products
//       .filter(product => product.type === "recurring")
//       .reduce((groups, product) => {
//         // ⚠️ Fix: Use `product.interval` instead of `product.recurring.interval`
//         const key = `${product.interval}-${product.interval_count}`;

//         if (!groups[key]) {
//           groups[key] = [];
//         }
//         groups[key].push({ price: product.stripePriceId, quantity: 1 });
//         return groups;
//       }, {} as Record<string, Stripe.SubscriptionCreateParams.Item[]>);

//     // ✅ Step 2: Create separate subscriptions for each billing interval group
//     let createdSubscriptions: Stripe.Subscription[] = [];

//     for (const [interval, subscriptionItems] of Object.entries(groupedProducts)) {
//       console.log(`🔄 Creating subscription for billing interval: ${interval}`);

//       const subscription = await stripe.subscriptions.create({
//         customer: customerId,
//         items: subscriptionItems, // ✅ Now correctly typed
//         collection_method: "send_invoice",
//         days_until_due: 7,
//         expand: ["latest_invoice.payment_intent"],
//         metadata: {  // ✅ Add metadata to subscription
//           deal_id: dealId,
//           billing_interval: interval,
//           created_by: "HubSpot Integration"
//         }
//       });

//       console.log(`📩 Subscription with invoice created for customer ${customerId}: ${subscription.id}`);
//       createdSubscriptions.push(subscription);

//       // ✅ Extract Invoice ID Safely
//       let invoiceId: string | null = null;

//       if (typeof subscription.latest_invoice === "string") {
//         invoiceId = subscription.latest_invoice;
//       } else if (subscription.latest_invoice && "id" in subscription.latest_invoice) {
//         invoiceId = subscription.latest_invoice.id;
//       }

//       // ✅ Step 5: Add Metadata to Invoice and Finalize
//       if (invoiceId) {
//         console.log(`📩 Updating invoice ${invoiceId} with metadata...`);

//         // ✅ Update Invoice with Metadata
//         await stripe.invoices.update(invoiceId, {
//           metadata: {
//             deal_id: dealId,
//             subscription_id: subscription.id,
//             created_by: "HubSpot Integration"
//           }
//         });

//       }
//       // ✅ Finalize the invoice immediately if found
//       if (invoiceId) {
//         const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoiceId);
//         console.log(`📨 Invoice finalized and sent immediately: ${finalizedInvoice.id}`);
//       } else {
//         console.warn(`⚠️ No invoice found for subscription: ${subscription.id}`);
//       }
//     }

//     return createdSubscriptions;
//   } catch (error) {
//     console.error(`❌ Error creating subscription with invoice for customer ${customerId}:`, error);
//     return null;
//   }
// };

const createSubscriptionWithInvoice = async (
  customerId,
  products,
  stripeAccessToken,
  dealId
) => {
  try {
    console.log("inside createSubscriptionWithInvoice");
    const stripe = stripeInstance(stripeAccessToken);

    // ✅ Step 1: Group products by `interval` and `interval_count`
    const groupedProducts: Record<
      string,
      Stripe.SubscriptionCreateParams.Item[]
    > = products
      .filter((product) => product.type === "recurring")
      .reduce((groups, product) => {
        const key = `${product.interval}-${product.interval_count}`;

        if (!groups[key]) {
          groups[key] = [];
        }

        // ✅ Use the correct quantity from the product
        groups[key].push({
          price: product.stripePriceId,
          quantity: product.quantity || 1,
        });
        return groups;
      }, {} as Record<string, Stripe.SubscriptionCreateParams.Item[]>);

    // ✅ Step 2: Create separate subscriptions for each billing interval group
    let createdSubscriptions: {
      subscriptionId: string;
      invoiceId: string | null;
    }[] = [];

    for (const [interval, subscriptionItems] of Object.entries(
      groupedProducts
    )) {
      console.log(`🔄 Creating subscription for billing interval: ${interval}`);

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: subscriptionItems,
        collection_method: "send_invoice",
        days_until_due: 7,
        expand: ["latest_invoice.payment_intent"],
        metadata: {
          deal_id: dealId,
          billing_interval: interval,
          created_by: "HubSpot Integration",
        },
      });

      console.log(
        `📩 Subscription with invoice created for customer ${customerId}: ${subscription.id}`
      );

      // ✅ Extract Invoice ID
      let invoiceId: string | null = null;
      if (typeof subscription.latest_invoice === "string") {
        invoiceId = subscription.latest_invoice;
      } else if (
        subscription.latest_invoice &&
        "id" in subscription.latest_invoice
      ) {
        invoiceId = subscription.latest_invoice.id;
      }

      // ✅ Add Metadata to Invoice and Finalize
      if (invoiceId) {
        console.log(`📩 Updating invoice ${invoiceId} with metadata...`);

        await stripe.invoices.update(invoiceId, {
          metadata: {
            deal_id: dealId,
            subscription_id: subscription.id,
            created_by: "HubSpot Integration",
          },
        });

        // ✅ Finalize the invoice
        const finalizedInvoice = await stripe.invoices.finalizeInvoice(
          invoiceId
        );
        console.log(
          `📨 Invoice finalized and sent immediately: ${finalizedInvoice.id}`
        );
      } else {
        console.warn(
          `⚠️ No invoice found for subscription: ${subscription.id}`
        );
      }

      // ✅ Collect Subscription and Invoice IDs
      createdSubscriptions.push({ subscriptionId: subscription.id, invoiceId });
    }

    return createdSubscriptions;
  } catch (error) {
    console.error(
      `❌ Error creating subscription with invoice for customer ${customerId}:`,
      error
    );
    return null;
  }
};

//newcode

const deleteStripeCustomer = async (stripeAccessToken, customerId) => {
  try {
    const stripe = new Stripe(stripeAccessToken as string, {
      apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
    });
    // const customer = await stripe.customers.del(customerId);
    // update the metadata.deleted to true
    const customer = await stripe.customers.update(customerId, {
      metadata: {
        deleted: "true",
      },
    });
  } catch (error) {
    console.error("Error deleting Stripe customer:", error);
  }
};

const deleteStripeProduct = async (stripeAccessToken, productId) => {
  try {
    const stripe = new Stripe(stripeAccessToken as string, {
      apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
    });
    // const product = await stripe.products.del(productId);
    // update the metadata.deleted to true
    const product = await stripe.products.update(productId, {
      metadata: {
        deleted: "true",
      },
    });
  } catch (error) {
    console.error("Error deleting Stripe product:", error);
  }
};

const createStripeCompany = async (company, stripeAccessToken, companyId) => {
  console.log(company);
  try {
    const stripe = new Stripe(stripeAccessToken as string, {
      apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
    });

    const stripeCompany = await stripe.customers.create({
      name: `${company.properties.name || ""}`,
      email: company.properties.email || "",
      phone: company.properties.phone || "",
      address: {
        city: company.properties.city || "",
        state: company.properties.state || "",
        postal_code: company.properties.zip || "",
        country: company.properties.country || "",
      },
      metadata: {
        hubspot_company_id: companyId, // ✅ Adding HubSpot Company ID
        industry: company.properties.industry || "",
        type: company.properties.type || "",
        number_of_employees: company.properties.numberofemployees || "",
        annual_revenue: company.properties.annualrevenue || "",
        time_zone: company.properties.timezone || "",
        description: company.properties.description || "",
        linkedin_url: company.properties.linkedincompanyprofile || "",
        deleted: "false",
      },
    });

    console.log("✅ Stripe Company Created:", stripeCompany.id);
    return stripeCompany.id;
  } catch (error) {
    console.error("Error creating Stripe company:", error);
    return null;
  }
};

const updateStripeCompany = async (
  stripeAccessToken,
  propertyName,
  propertyValue,
  companyId
) => {
  try {
    const stripeUpdateFields = {
      firstname: "name",
      lastname: "name",
      email: "email",
      phone: "phone",
      company: "metadata.company",
      website: "metadata.website",
      address: "address.line1",
      city: "address.city",
      state: "address.state",
      zip: "address.postal_code",
      country: "address.country",
      industry: "metadata.industry",
      hubspot_owner_id: "metadata.hubspot_owner_id",
      lead_status: "metadata.lead_status",
      companyustomer_notes: "metadata.notes",
      deleted: "metadata.deleted",
      hs_lead_status: "metadata.lead_status",
      annual_revenue: "metadata.annual_revenue",
      number_of_employees: "metadata.number_of_employees",
      type: "metadata.type",
      time_zone: "metadata.time_zone",
      description: "metadata.description",
      linkedin_url: "metadata.linkedin_url",
    };

    const updateData: Record<string, any> = {
      metadata: {}, // Ensure metadata exists
      address: {}, // Ensure address exists
    };

    if (propertyName in stripeUpdateFields) {
      const stripeField = stripeUpdateFields[propertyName];

      if (stripeField.startsWith("metadata.")) {
        const metadataKey = stripeField.split(".")[1];
        updateData.metadata[metadataKey] = propertyValue;
      } else if (stripeField.startsWith("address.")) {
        updateData.address[stripeField.split(".")[1]] = propertyValue;
      } else {
        updateData[stripeField] = propertyValue;
      }
    }

    // Remove empty objects to avoid errors in the API request
    if (Object.keys(updateData.metadata).length === 0)
      delete updateData.metadata;
    if (Object.keys(updateData.address).length === 0) delete updateData.address;

    const stripe = new Stripe(stripeAccessToken as string, {
      apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
    });
    const companyUpdate = await stripe.customers.update(companyId, updateData);
  } catch (error) {
    console.error("Error updating Stripe company:", error);
  }
};

const deleteStripeCompany = async (stripeAccessToken, companyId) => {
  try {
    const stripe = new Stripe(stripeAccessToken as string, {
      apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
    });
    // const company = await stripe.customers.del(companyId);
    // update the metadata.deleted to true
    const company = await stripe.customers.update(companyId, {
      metadata: {
        deleted: "true",
      },
    });
  } catch (error) {
    console.error("Error deleting Stripe company:", error);
  }
};

const getCompanyStripeId = async (companyId, stripeAccessToken) => {
  try {
    const stripe = new Stripe(stripeAccessToken as string, {
      apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
    });
    let customers: Stripe.Customer[] = [];

    const response = await stripe.customers.list({
      limit: 100,
    });

    customers = response.data; // Collect all customers

    // Find the matching customer based on metadata
    const customer = customers.find((cust) => {
      return (
        cust.metadata.hubspot_company_id.toString() === companyId.toString()
      );
    });

    if (!customer) {
      console.log("❌ No matching customer found for company:", companyId);
      return null;
    }

    return customer.id;
  } catch (error) {
    console.error("Error fetching company stripe id:", error);
    return null;
  }
};

const getCustomerStripeId = async (companyId, stripeAccessToken) => {
  try {
    const stripe = new Stripe(stripeAccessToken as string, {
      apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
    });
    let customers: Stripe.Customer[] = [];

    const response = await stripe.customers.list({
      limit: 100,
    });

    customers = response.data; // Collect all customers

    // Find the matching customer based on metadata
    const customer = customers.find((cust) => {
      return (
        cust.metadata.hubspot_contact_id.toString() === companyId.toString()
      );
    });

    if (!customer) {
      console.log("❌ No matching customer found for company:", companyId);
      return null;
    }

    return customer.id;
  } catch (error) {
    console.error("Error fetching company stripe id:", error);
    return null;
  }
};

const getProductStripeId = async (companyId, stripeAccessToken) => {
  try {
    const stripe = new Stripe(stripeAccessToken as string, {
      apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
    });
    let products: Stripe.Product[] = [];

    const response = await stripe.products.list({
      limit: 100,
    });

    products = response.data; // Collect all products

    // Find the matching product based on metadata
    const product = products.find((cust) => {
      return (
        cust.metadata.hubspot_product_id.toString() === companyId.toString()
      );
    });

    if (!product) {
      console.log("❌ No matching product found for company:", companyId);
      return null;
    }

    return product.id;
  } catch (error) {
    console.error("Error fetching company stripe id:", error);
    return null;
  }
};

const fetchStripeInvoice = async (invoiceId, stripeAccessToken) => {
  try {
    const stripe = new Stripe(stripeAccessToken as string, {
      apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
    });
    const invoice = (await stripe.invoices.retrieve(
      invoiceId
    )) as Stripe.Invoice;
    return invoice;
  } catch (error) {
    console.error("Error fetching company stripe id:", error);
    return null;
  }
};

export {
  createStripeCustomer,
  updateStripeCustomer,
  createProduct,
  updateStripeProduct,
  fetchStripePriceDetails,
  processStripePayments,
  createStripeCompany,
  updateStripeCompany,
  deleteStripeCompany,
  getCompanyStripeId,
  getCustomerStripeId,
  deleteStripeCustomer,
  getProductStripeId,
  deleteStripeProduct,
  fetchStripeInvoice,
};
