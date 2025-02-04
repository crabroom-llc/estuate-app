import Stripe from "stripe";

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
    const { id, properties } = productData;
    const {
      name,
      price,
      sku,
      description,
      billing_frequency, // Monthly, Yearly, One-time
      createdate,
      hs_lastmodifieddate,
    } = properties;

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
          console.warn(`⚠️ Unknown billing frequency: ${billing_frequency}. Defaulting to one-time payment.`);
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
      },
    });

    // 🔹 Step 4: Create Price in Stripe (Recurring or One-time)
    const stripePrice = await stripe.prices.create({
      unit_amount: priceInCents,
      currency: "usd", // Modify as needed
      product: stripeProduct.id,
      recurring: stripeRecurring || undefined, // If null, it will be one-time
    });

    console.log("✅ Stripe Product Created:", stripeProduct.id);
    console.log("✅ Stripe Price Created:", stripePrice.id);
    const productId=stripeProduct.id
    return { productId };
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

    console.log(`🔹 Updating Stripe product: ${productId} for ${propertyName}...`);

    // Fetch existing product
    const existingProduct = await stripe.products.retrieve(productId);

    // Initialize update object
    let updateData: Stripe.ProductUpdateParams = {};
    let metadataUpdate: Record<string, string> = existingProduct.metadata || {};

    // 🔹 Handle Standard Stripe Fields
    switch (propertyName) {
      case "name":
        updateData.name = propertyValue;
        break;

      case "description":
        updateData.description = propertyValue;
        break;

      case "recurringbillingfrequency":
        console.log(`⏳ Updating Stripe price due to billing frequency change: ${propertyValue}`);
        await updateStripePricing(stripe, productId, propertyValue);
        return; // Pricing handled separately, exit function

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
    console.log(`🔄 Updating pricing for product: ${productId} to ${billing_frequency}`);

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
        console.warn(`⚠️ Unknown billing frequency: ${billing_frequency}. Skipping update.`);
        return;
    }

    // Get the current price object for the product
    const prices = await stripe.prices.list({ product: productId, active: true });

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

  } catch (error) {
    console.error("❌ Error updating Stripe pricing:", error);
  }
};


export { createStripeCustomer, updateStripeCustomer, createProduct, updateStripeProduct };
