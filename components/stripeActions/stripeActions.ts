import Stripe from "stripe";
import { pool } from "@/utils/mysql";

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
      name: `${contact.properties?.firstname || ""} ${
        contact.properties?.lastname || ""
      }`.trim(),
      email: contact.properties.email || "",
      phone: contact.properties.phone || "",
      metadata: {
        hubspot_contact_id: contactId, // ✅ Adding HubSpot Contact ID
        deleted: "false",
        firstName: contact.properties?.firstname || "",
        lastName: contact.properties?.lastname || "",
      },
    });

    console.log("✅ Stripe Customer Created:", customer.id);
    return customer.id;
  } catch (error) {
    console.error("Error creating Stripe customer:", error);
    return null;
  }
};

// const updateStripeCustomer = async (
//   stripeAccessToken,
//   propertyName,
//   propertyValue,
//   customerId
// ) => {
//   try {
//     const stripeUpdateFields = {
//       firstname: "name",
//       lastname: "name",
//       email: "email",
//       phone: "phone",
//       company: "metadata.company",
//       website: "metadata.website",
//       address: "address.line1",
//       city: "address.city",
//       state: "address.state",
//       zip: "address.postal_code",
//       country: "address.country",
//       industry: "metadata.industry",
//       hubspot_owner_id: "metadata.hubspot_owner_id",
//       lead_status: "metadata.lead_status",
//       customer_notes: "metadata.notes",
//       deleted: "metadata.deleted",
//       hs_lead_status: "metadata.lead_status",
//     };

//     let updateData: Record<string, any> = {
//       metadata: {}, // Ensure metadata exists
//       address: {}, // Ensure address exists
//     };

//     const stripe = new Stripe(stripeAccessToken as string, {
//       apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
//     });

//     // 🔹 Retrieve the existing customer to get metadata
//     const existingCustomer = (await stripe.customers.retrieve(
//       customerId
//     )) as any;

//     if (!existingCustomer || existingCustomer.deleted) {
//       console.error("❌ Error: Customer not found or deleted.");
//       return;
//     }

//     // Extract current metadata safely
//     const currentMetadata = existingCustomer.metadata || {};
//     const currentFirstName = currentMetadata.firstName || "";
//     const currentLastName = currentMetadata.lastName || {};

//     if (propertyName === "firstname") {
//       // 🔹 Update name using new first name + existing last name
//       updateData.name = `${propertyValue} ${currentLastName}`.trim();
//       updateData.metadata.firstName = propertyValue; // Also update metadata
//     } else if (propertyName === "lastname") {
//       // 🔹 Update name using existing first name + new last name
//       updateData.name = `${currentFirstName} ${propertyValue}`.trim();
//       updateData.metadata.lastName = propertyValue; // Also update metadata
//     } else if (propertyName in stripeUpdateFields) {
//       const stripeField = stripeUpdateFields[propertyName];

//       if (stripeField.startsWith("metadata.")) {
//         const metadataKey = stripeField.split(".")[1];
//         updateData.metadata[metadataKey] = propertyValue;
//       } else if (stripeField.startsWith("address.")) {
//         updateData.address[stripeField.split(".")[1]] = propertyValue;
//       } else {
//         updateData[stripeField] = propertyValue;
//       }
//     }

//     // Remove empty objects to avoid errors in the API request
//     if (Object.keys(updateData.metadata).length === 0)
//       delete updateData.metadata;
//     if (Object.keys(updateData.address).length === 0) delete updateData.address;
//   console.log(JSON.stringify(updateData));
//     const customerUpdate = await stripe.customers.update(
//       customerId,
//       updateData
//     );
//   } catch (error) {
//     console.error("Error updating Stripe customer:", error);
//   }
// };

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
      jobtitle: "metadata.metadata",
    };

    const updateData: Record<string, any> = {
      metadata: {}, // Ensure metadata exists
      address: {}, // Ensure address exists
    };

    const stripe = new Stripe(stripeAccessToken as string, {
      apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
    });

    // 🔹 Retrieve the existing customer to get metadata
    const existingCustomer = (await stripe.customers.retrieve(
      customerId
    )) as any;

    if (!existingCustomer || existingCustomer.deleted) {
      console.error("❌ Error: Customer not found or deleted.");
      return;
    }

    // Extract current metadata safely
    const currentMetadata = existingCustomer.metadata || {};
    const currentFirstName = currentMetadata.firstName || "";
    const currentLastName = currentMetadata.lastName || ""; // ✅ Fix: Default to empty string

    if (propertyName === "firstname") {
      // 🔹 Update name using new first name + existing last name
      updateData.name = `${propertyValue} ${currentLastName}`.trim();
      updateData.metadata.firstName = propertyValue; // ✅ Also update metadata
      updateData.metadata.lastName = currentLastName; // ✅ Ensure last name is not lost
    } else if (propertyName === "lastname") {
      // 🔹 Update name using existing first name + new last name
      updateData.name = `${currentFirstName} ${propertyValue}`.trim();
      updateData.metadata.firstName = currentFirstName; // ✅ Ensure first name is not lost
      updateData.metadata.lastName = propertyValue; // ✅ Also update metadata
    } else if (propertyName in stripeUpdateFields) {
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

    // ✅ Ensure metadata includes both firstName and lastName before sending the update
    if (!updateData.metadata.firstName)
      updateData.metadata.firstName = currentFirstName;
    if (!updateData.metadata.lastName)
      updateData.metadata.lastName = currentLastName;

    // ✅ Log what we're sending to Stripe for debugging
    console.log(
      "🔹 Final updateData sent to Stripe:",
      JSON.stringify(updateData)
    );

    // Remove empty objects to avoid errors in the API request
    if (Object.keys(updateData.metadata).length === 0)
      delete updateData.metadata;
    if (Object.keys(updateData.address).length === 0) delete updateData.address;

    // 🔹 Perform the update in Stripe
    const customerUpdate = await stripe.customers.update(
      customerId,
      updateData
    );

    console.log(
      `✅ Successfully updated Stripe customer ${customerId}:`,
      customerUpdate
    );
  } catch (error) {
    console.error("❌ Error updating Stripe customer:", error);
  }
};

const createProduct = async (stripeAccessToken, productData) => {
  try {
    const { id, properties } = productData || {}; // Default to an empty object if productData is undefined

    const {
      name = null,
      price = null,
      sku = null,
      description,
      recurringbillingfrequency = null, // Monthly, Yearly, One-time
      createdate = null,
      hs_lastmodifieddate = null,
    } = properties || {};
    const billing_frequency = recurringbillingfrequency;
    // Convert  price to cents (Stripe expects amounts in cents)
    const priceInCents = Math.round(parseFloat(price) * 100);

    // Determine billing frequency for Stripe pricing
    let stripeRecurring: Stripe.PriceCreateParams.Recurring | undefined;

    if (billing_frequency && billing_frequency.toLowerCase() != "one_time") {
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

const createUsageBasedProductPerUnit = async (
  stripeAccessToken,
  productData
) => {
  try {
    const { id, properties } = productData || {}; // Default to an empty object if productData is undefined

    const {
      name,
      price,
      sku,
      description,
      recurringbillingfrequency,
      createdate,
      hs_lastmodifieddate,
      billing_type,
      usage_model,
      unit_price,
      package_price,
      package_units,
      tier_mode,
      tiers_json,
      currency,
      stripe_product_id,
    } = properties || {};

    if (!name || !price) {
      console.error("❌ Error: Missing required fields (name or price).");
      return;
    }

    if(stripe_product_id){

      console.log("Product already exists in stripe");
      return; 
    }
    const billing_frequency = recurringbillingfrequency;
    // Convert price to cents (Stripe expects amounts in cents)
    const priceInCents = Math.round(parseFloat(unit_price) * 100);

    // Determine billing frequency for Stripe pricing
    let stripeRecurring: Stripe.PriceCreateParams.Recurring | undefined;

    if (billing_frequency && billing_frequency.toLowerCase() != "one_time") {
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

    // 🔹 Step 1: Create the Product in Stripe
    const stripeProduct = await stripe.products.create({
      name,
      description,
      metadata: {
        hubspot_product_id: id,
        hubspot_sku: sku || "N/A",
        hubspot_created_at: createdate || "N/A",
        hubspot_last_modified: hs_lastmodifieddate || "N/A",
        pricing_model: billing_type,
        usage_type: usage_model,
        deleted: "false",
      },
    });

    const stripeMeter = await stripe.billing.meters.create({
      display_name: `${name}_meter`,
      event_name: `${name}_event`,
      default_aggregation: {
        formula: "sum",
      },
      value_settings: {
        event_payload_key: "value",
      },
      customer_mapping: {
        type: "by_id",
        event_payload_key: "stripe_customer_id",
      },
    });

    // 🔹 Step 2: Create a Per-Unit Usage-Based Price in Stripe
    const stripePrice = await stripe.prices.create({
      unit_amount: priceInCents,
      currency: currency.toLowerCase(), // Ensure currency is in lowercase
      product: stripeProduct.id,
      recurring: {
        interval: stripeRecurring?.interval || "month",
        usage_type: "metered",
        meter: stripeMeter.id,
      },
      billing_scheme: usage_model,
      metadata: {
        pricing_model: "usage_based",
        usage_type: "per_unit",
        deleted: "false",
        meterId: stripeMeter.id,
        meterName: `${name}_meter`,
      },
    });

    console.log("✅ Stripe Usage-Based Product Created:", stripeProduct.id);
    console.log("✅ Stripe Per-Unit Price Created:", stripePrice.id);

    return {
      productId: stripeProduct.id,
      priceId: stripePrice.id,
      meterId: stripeMeter.id,
    };
  } catch (error) {
    console.error("❌ Error creating usage-based product:", error);
  }
};

const createUsageBasedProductPerPackage = async (
  stripeAccessToken,
  productData
) => {
  try {
    const { id, properties } = productData || {}; // Default to an empty object if productData is undefined

    const {
      name,
      price,
      sku,
      description,
      recurringbillingfrequency,
      createdate,
      hs_lastmodifieddate,
      billing_type,
      usage_model,
      unit_price,
      package_price,
      package_units,
      overage_value,
      tier_mode,
      tiers_json,
      currency,
      stripe_product_id,
    } = properties || {};

    if (!name || !price) {
      console.error("❌ Error: Missing required fields (name or price).");
      return;
    }

    const billing_frequency = recurringbillingfrequency;
    // Convert price to cents (Stripe expects amounts in cents)
    const priceInCents = Math.round(parseFloat(package_price) * 100);

    // Determine billing frequency for Stripe pricing
    let stripeRecurring: Stripe.PriceCreateParams.Recurring | undefined;
    // Convert prices to cents (Stripe expects amounts in cents)
    const packagePriceInCents = Math.round(parseFloat(package_price) * 100);
    const overagePriceInCents = overage_value
      ? Math.round(parseFloat(overage_value) * 100)
      : null;

    const stripe = new Stripe(stripeAccessToken as string, {
      apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
    });

    // 🔹 Step 1: Create the Product in Stripe
    const stripeProduct = await stripe.products.create({
      name,
      description,
      metadata: {
        hubspot_product_id: id,
        hubspot_sku: sku || "N/A",
        hubspot_created_at: createdate || "N/A",
        hubspot_last_modified: hs_lastmodifieddate || "N/A",
        pricing_model: billing_type,
        usage_type: usage_model,
        deleted: "false",
      },
    });

    const stripeMeter = await stripe.billing.meters.create({
      display_name: `${name}_meter`,
      event_name: `${name}_event`,
      default_aggregation: {
        formula: "sum",
      },
      value_settings: {
        event_payload_key: "value",
      },
      customer_mapping: {
        type: "by_id",
        event_payload_key: "stripe_customer_id",
      },
    });

    if (billing_frequency && billing_frequency.toLowerCase() != "one_time") {
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

    if (overage_value) {
      const overagePriceInCents = Math.round(parseFloat(overage_value) * 100);
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
      const priceId = stripePrice?.id;
      const productId = stripeProduct?.id;

    // 🔹 Step 2: Create a Per-Unit Usage-Based Price in Stripe
    const overagePrice = await stripe.prices.create({
      unit_amount: overagePriceInCents,
      currency: currency.toLowerCase(), // Ensure currency is in lowercase
      product: stripeProduct.id,
      recurring: {
        interval: stripeRecurring?.interval || "month",
        usage_type: "metered",
        meter: stripeMeter.id,
      },
      billing_scheme: "per_unit",
      metadata: {
        pricing_model: "usage_based",
        usage_type: "per_unit",
        deleted: "false",
        meterId: stripeMeter.id,
        meterName: `${name}_meter`,
      },
    });

      console.log("✅ Stripe Subscription Product Created:", productId);
      console.log("✅ Stripe Subscription Price Created:", priceId);
      console.log("✅ Stripe Overage Product Created:", productId);
      console.log("✅ Stripe Overage Price Created:", overagePrice.id);

      return {
        productId: productId,
        priceId: priceId,
        overagePriceId: overagePrice.id,
        meterId: stripeMeter.id,
      };
    } else {
      // 🔹 Step 2: Create a Per-Unit Usage-Based Price in Stripe
      const stripePrice = await stripe.prices.create({
        unit_amount: priceInCents,
        currency: currency.toLowerCase(), // Ensure currency is in lowercase
        product: stripeProduct.id,
        recurring: {
          interval: stripeRecurring?.interval || "month",
          usage_type: "metered",
          meter: stripeMeter.id,
        },
        billing_scheme: "per_unit",
        transform_quantity: {
          divide_by: package_units,
          round: "up",
        },
        metadata: {
          pricing_model: "usage_based",
          usage_type: "per_unit",
          deleted: "false",
          meterId: stripeMeter.id,
          meterName: `${name}_meter`,
        },
      });

      console.log("✅ Stripe Usage-Based Product Created:", stripeProduct.id);
      console.log("✅ Stripe Per-Unit Price Created:", stripePrice.id);

      return {
        productId: stripeProduct.id,
        priceId: stripePrice.id,
        overagePriceId: null,
        meterId: stripeMeter.id,
      };
    }
  } catch (error) {
    console.error("❌ Error creating usage-based product:", error);
  }
};

const createUsageBasedProductPerTeir = async (
  stripeAccessToken,
  productData
) => {
  try {
    const { id, properties } = productData || {}; // Default to an empty object if productData is undefined

    const {
      name,
      price,
      sku,
      description,
      recurringbillingfrequency,
      createdate,
      hs_lastmodifieddate,
      billing_type,
      usage_model,
      unit_price,
      package_price,
      package_units,
      tier_mode,
      tiers_json,
      currency,
      stripe_product_id,
    } = properties || {};

    if (!name || !price) {
      console.error("❌ Error: Missing required fields (name or price).");
      return;
    }

    const billing_frequency = recurringbillingfrequency;
    // Convert price to cents (Stripe expects amounts in cents)
    const priceInCents = Math.round(parseFloat(package_price) * 100);

    // Determine billing frequency for Stripe pricing
    let stripeRecurring: Stripe.PriceCreateParams.Recurring | undefined;

    if (billing_frequency && billing_frequency.toLowerCase() != "one_time") {
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

    // 🔹 Step 1: Create the Product in Stripe
    const stripeProduct = await stripe.products.create({
      name,
      description,
      metadata: {
        hubspot_product_id: id,
        hubspot_sku: sku || "N/A",
        hubspot_created_at: createdate || "N/A",
        hubspot_last_modified: hs_lastmodifieddate || "N/A",
        pricing_model: billing_type,
        usage_type: usage_model,
        deleted: "false",
      },
    });

    const stripeMeter = await stripe.billing.meters.create({
      display_name: `${name}_meter`,
      event_name: `${name}_event`,
      default_aggregation: {
        formula: "sum",
      },
      value_settings: {
        event_payload_key: "value",
      },
      customer_mapping: {
        type: "by_id",
        event_payload_key: "stripe_customer_id",
      },
    });

    console.log("JSON coming from HubSpot:", tiers_json);

    // ✅ Ensure tiers_json is a valid object or parse it if it's a string
    let tiers;
    if (typeof tiers_json === "string") {
      tiers = JSON.parse(tiers_json);
    } else if (Array.isArray(tiers_json)) {
      tiers = tiers_json;
    } else {
      throw new Error("Invalid tiers_json format");
    }

    // ✅ Convert unit_amount to cents
    const formattedTiers = tiers.map((tier) => ({
      up_to: tier.up_to, // Keep up_to as is
      unit_amount: Math.round(parseFloat(tier.unit_amount) * 100), // Convert to cents
    }));

    console.log("✅ Formatted tiers:", formattedTiers);

    // 🔹 Step 2: Create a Per-Unit Usage-Based Price in Stripe
    const stripePrice = await stripe.prices.create({
      // unit_amount: priceInCents,
      currency: currency.toLowerCase(), // Ensure currency is in lowercase
      product: stripeProduct.id,
      recurring: {
        interval: "month",
        usage_type: "metered",
        meter: stripeMeter.id,
      },
      billing_scheme: "tiered",
      tiers_mode: tier_mode,
      tiers: formattedTiers,
      metadata: {
        pricing_model: "usage_based",
        usage_type: "per_unit",
        deleted: "false",
        meterId: stripeMeter.id,
        meterName: `${name}_meter`,
      },
    });

    console.log("✅ Stripe Usage-Based Product Created:", stripeProduct.id);
    console.log("✅ Stripe Per-Unit Price Created:", stripePrice.id);

    return {
      productId: stripeProduct.id,
      priceId: stripePrice.id,
      meterId: stripeMeter.id,
    };
  } catch (error) {
    console.error("❌ Error creating usage-based product:", error);
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
    const updateData: Stripe.ProductUpdateParams = {};
    const metadataUpdate: Record<string, string> =
      existingProduct.metadata || {};
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

      case "unit_price":
        console.log(`⏳ Updating Stripe price for product: ${productId}...`);
        stripePriceId = await updateStripePricamount(
          stripe,
          productId,
          propertyValue
        );
        return stripePriceId;

      case "currency":
        console.log(`⏳ Updating Stripe price for product: ${productId}...`);
        stripePriceId = await updateStripeCurrency(
          stripe,
          productId,
          propertyValue
        );
        return stripePriceId;

      case "package_price":
        console.log(`⏳ Updating Stripe price for product: ${productId}...`);
        stripePriceId = await updateStripePackagePrice(
          stripe,
          productId,
          propertyValue
        );
        return stripePriceId;

      case "tier_mode":
        console.log(`⏳ Updating Stripe price for product: ${productId}...`);
        stripePriceId = await updateStripeTierMode(
          stripe,
          productId,
          propertyValue
        );
        return stripePriceId;

      case "tiers_json":
        console.log(`⏳ Updating Stripe price for product: ${productId}...`);
        stripePriceId = await updateStripeTiers(
          stripe,
          productId,
          propertyValue
        );
        return stripePriceId;
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
    const meterId = oldPrice.recurring?.meter;

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
            meter: oldPrice.recurring.meter ?? undefined, // Optional
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

    if (meterId) {
      return { price_id: newPriceObj.id, meter_id: meterId };
    }

    return newPriceObj.id;
  } catch (error) {
    console.error("❌ Error updating Stripe price:", error);
    return null;
  }
};

const updateStripeCurrency = async (
  stripe: Stripe,
  productId: string,
  currency: string
) => {
  try {
    console.log(
      `🔄 Updating currency for product: ${productId} to ${currency}`
    );

    // Fetch the existing active price(s)
    const prices = await stripe.prices.list({
      product: productId,
      active: true,
      expand: ["data.tiers"],
    });

    if (prices.data.length === 0) {
      console.warn(
        `⚠️ No active price found for product ${productId}. Creating a new one.`
      );
    }

    // Use the most recent active price as a reference
    const oldPrice = prices.data[0] ?? {};
    const meterId = oldPrice.recurring?.meter;
    console.log("🚀 => oldPrice.tiers:", oldPrice);

    // ✅ Copy all attributes except `unit_amount`
    const newPriceData: Stripe.PriceCreateParams = {
      unit_amount: oldPrice.unit_amount ?? undefined, // Keep same amount or undefined
      currency: currency || "usd", // Keep same currency, default to "usd"
      product: productId,
      recurring: oldPrice.recurring
        ? {
            interval: oldPrice.recurring.interval,
            interval_count: oldPrice.recurring.interval_count ?? 1, // Default to 1
            usage_type: oldPrice.recurring.usage_type ?? "licensed", // Default value
            aggregate_usage: oldPrice.recurring.aggregate_usage ?? undefined, // Optional
            meter: oldPrice.recurring.meter ?? undefined, // Optional
          }
        : undefined, // Fix: Ensure correct type

      metadata: oldPrice.metadata ?? {}, // Copy metadata
      tax_behavior: oldPrice.tax_behavior ?? "unspecified", // Copy tax behavior
      billing_scheme: oldPrice.billing_scheme ?? "per_unit", // Copy billing scheme
      tiers_mode: oldPrice.tiers_mode ?? undefined, // Fix
      tiers: oldPrice.tiers?.map((tier: any) => {
        return {
          up_to: tier.up_to ?? "inf",
          unit_amount: tier.unit_amount,
        };
      }) as Stripe.PriceCreateParams.Tier[], // Fix
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

    if (meterId) {
      return { price_id: newPriceObj.id, meter_id: meterId };
    }

    return newPriceObj.id;
  } catch (error) {
    console.error("❌ Error updating Stripe price:", error);
    return null;
  }
};

const updateStripeTierMode = async (
  stripe: Stripe,
  productId: string,
  tierMode: string
) => {
  try {
    console.log(
      `🔄 Updating tier mode for product: ${productId} to ${tierMode}`
    );

    // Fetch the existing active price(s)
    const prices = await stripe.prices.list({
      product: productId,
      active: true,
      expand: ["data.tiers"],
    });

    if (prices.data.length === 0) {
      console.warn(
        `⚠️ No active price found for product ${productId}. Creating a new one.`
      );
    }

    // Use the most recent active price as a reference
    const oldPrice = prices.data[0] ?? {};
    const meterId = oldPrice.recurring?.meter;
    console.log("🚀 => oldPrice.tiers:", oldPrice);

    // ✅ Copy all attributes except `unit_amount`
    const newPriceData: Stripe.PriceCreateParams = {
      unit_amount: oldPrice.unit_amount ?? undefined, // Keep same amount or undefined
      currency: oldPrice.currency || "usd", // Keep same currency, default to "usd"
      product: productId,
      recurring: oldPrice.recurring
        ? {
            interval: oldPrice.recurring.interval,
            interval_count: oldPrice.recurring.interval_count ?? 1, // Default to 1
            usage_type: oldPrice.recurring.usage_type ?? "licensed", // Default value
            aggregate_usage: oldPrice.recurring.aggregate_usage ?? undefined, // Optional
            meter: oldPrice.recurring.meter ?? undefined, // Optional
          }
        : undefined, // Fix: Ensure correct type

      metadata: oldPrice.metadata ?? {}, // Copy metadata
      tax_behavior: oldPrice.tax_behavior ?? "unspecified", // Copy tax behavior
      billing_scheme: oldPrice.billing_scheme ?? "per_unit", // Copy billing scheme
      tiers_mode: (tierMode as Stripe.PriceCreateParams.TiersMode) || undefined, // Fix
      tiers: oldPrice.tiers?.map((tier: any) => {
        return {
          up_to: tier.up_to ?? "inf",
          unit_amount: tier.unit_amount,
        };
      }) as Stripe.PriceCreateParams.Tier[], // Fix
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

    if (meterId) {
      return { price_id: newPriceObj.id, meter_id: meterId };
    }

    return newPriceObj.id;
  } catch (error) {
    console.error("❌ Error updating Stripe price:", error);
    return null;
  }
};

const updateStripeTiers = async (
  stripe: Stripe,
  productId: string,
  tiers_json: string | any[]
) => {
  try {
    console.log(
      `🔄 Updating tiers_json for product: ${productId} to ${tiers_json}`
    );

    // Fetch the existing active price(s)
    const prices = await stripe.prices.list({
      product: productId,
      active: true,
      expand: ["data.tiers"],
    });

    if (prices.data.length === 0) {
      console.warn(
        `⚠️ No active price found for product ${productId}. Creating a new one.`
      );
    }

    let tiers;
    if (typeof tiers_json === "string") {
      tiers = JSON.parse(tiers_json);
    } else if (Array.isArray(tiers_json)) {
      tiers = tiers_json;
    } else {
      throw new Error("Invalid tiers_json format");
    }

    // ✅ Convert unit_amount to cents
    const formattedTiers = tiers.map((tier) => ({
      up_to: tier.up_to, // Keep up_to as is
      unit_amount: Math.round(parseFloat(tier.unit_amount) * 100), // Convert to cents
    }));

    // Use the most recent active price as a reference
    const oldPrice = prices.data[0] ?? {};
    const meterId = oldPrice.recurring?.meter;

    // ✅ Copy all attributes except `unit_amount`
    const newPriceData: Stripe.PriceCreateParams = {
      unit_amount: oldPrice.unit_amount ?? undefined, // Keep same amount or undefined
      currency: oldPrice.currency || "usd", // Keep same currency, default to "usd"
      product: productId,
      recurring: oldPrice.recurring
        ? {
            interval: oldPrice.recurring.interval,
            interval_count: oldPrice.recurring.interval_count ?? 1, // Default to 1
            usage_type: oldPrice.recurring.usage_type ?? "licensed", // Default value
            aggregate_usage: oldPrice.recurring.aggregate_usage ?? undefined, // Optional
            meter: oldPrice.recurring.meter ?? undefined, // Optional
          }
        : undefined, // Fix: Ensure correct type

      metadata: oldPrice.metadata ?? {}, // Copy metadata
      tax_behavior: oldPrice.tax_behavior ?? "unspecified", // Copy tax behavior
      billing_scheme: oldPrice.billing_scheme ?? "per_unit", // Copy billing scheme
      tiers_mode: oldPrice.tiers_mode ?? undefined, // Fix
      tiers: formattedTiers,
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

    if (meterId) {
      return { price_id: newPriceObj.id, meter_id: meterId };
    }

    return newPriceObj.id;
  } catch (error) {
    console.error("❌ Error updating Stripe price:", error);
    return null;
  }
};

const updateStripePackagePrice = async (
  stripe: Stripe,
  productId: string,
  packagePrice: string
) => {
  try {
    console.log(
      `🔄 Updating package price for product: ${productId} to ${packagePrice}`
    );

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
    const meterId = oldPrice.recurring?.meter;

    // Convert price to cents
    const newPriceInCents = parseInt(packagePrice) * 100;

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
            meter: oldPrice.recurring.meter ?? undefined, // Optional
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

    if (meterId) {
      return { price_id: newPriceObj.id, meter_id: meterId };
    }

    return newPriceObj.id;
  } catch (error) {
    console.error("❌ Error updating Stripe price:", error);
    return null;
  }
};

const updateStripePackageUnits = async (
  stripe: Stripe,
  productId: string,
  packageUnits: number
) => {
  try {
    console.log(
      `🔄 Updating package units for product: ${productId} to ${packageUnits}`
    );

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
    const meterId = oldPrice.recurring?.meter;

    // Convert price to cents

    // ✅ Copy all attributes except `unit_amount`
    const newPriceData: Stripe.PriceCreateParams = {
      unit_amount: oldPrice.unit_amount ?? undefined, // Keep same amount or undefined
      currency: oldPrice.currency || "usd", // Keep same currency, default to "usd"
      product: productId,
      recurring: oldPrice.recurring
        ? {
            interval: oldPrice.recurring.interval,
            interval_count: oldPrice.recurring.interval_count ?? 1, // Default to 1
            usage_type: oldPrice.recurring.usage_type ?? "licensed", // Default value
            aggregate_usage: oldPrice.recurring.aggregate_usage ?? undefined, // Optional
            meter: oldPrice.recurring.meter ?? undefined, // Optional
          }
        : undefined, // Fix: Ensure correct type

      metadata: oldPrice.metadata ?? {}, // Copy metadata
      tax_behavior: oldPrice.tax_behavior ?? "unspecified", // Copy tax behavior
      billing_scheme: oldPrice.billing_scheme ?? "per_unit", // Copy billing scheme
      tiers_mode: oldPrice.tiers_mode ?? undefined, // Fix
      transform_quantity: {
        divide_by: packageUnits,
        round: "up",
      },
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

    if (meterId) {
      return { price_id: newPriceObj.id, meter_id: meterId };
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
      type: price.recurring
        ? price.metadata.pricing_model === "usage_based"
          ? "usage_based"
          : "recurring"
        : "one_time",
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

//main
// const processStripePayments = async (dealData, stripeAccessToken) => {
//   try {
//     console.log(
//       "🔹 Processing Stripe Payments:",
//       JSON.stringify(dealData, null, 2)
//     );

//     const { dealId, customer, products, amount } = dealData;

//     // ✅ Explicitly define responseData with correct types
//     const responseData: {
//       dealId: string;
//       invoices: { id: string; created_at: string }[];
//       subscriptions: { id: string; created_at: string }[];
//       amount: number;
//     } = {
//       dealId: dealId,
//       invoices: [],
//       subscriptions: [],
//       amount: amount,
//     };

//     for (const customerId of customer) {
//       console.log(`✅ Processing for Customer: ${customerId}`);

//       if (!products) {
//         console.log(
//           `📩 No Stripe products found for ${customerId}. Creating a manual invoice for ${amount}...`
//         );
//         const manualInvoice = await createManualInvoice(
//           customerId,
//           amount,
//           stripeAccessToken,
//           dealId
//         );
//         if (manualInvoice) {
//           console.log(
//             `📩 Manual invoice created for Customer ${customerId}: ${manualInvoice.id}`
//           );
//           responseData.invoices.push({
//             id: manualInvoice.id,
//             created_at: new Date(manualInvoice.created * 1000).toISOString(),
//           }); // ✅ Collect Manual Invoice ID
//           return responseData;
//         } else {
//           console.error(
//             `❌ Failed to create manual invoice for Customer ${customerId}`
//           );
//         }
//       }

//       // ✅ Separate one-time and recurring products
//       const oneTimeProducts = products.filter(
//         (product) => product.type === "one_time"
//       );
//       const recurringProducts = products.filter(
//         (product) => product.type === "recurring"
//       );
//       const usageBasedProducts = products.filter(
//         (product) => product.type === "usage_based"
//       );
//       console.log("usageBasedProducts are here: "+JSON.stringify(usageBasedProducts));
//       // ✅ Process One-Time Products (Invoice)
//       if (oneTimeProducts.length > 0) {
//         console.log(
//           `💰 Customer ${customerId} has one-time products. Creating invoice...`
//         );
//         const invoice = await createStripeInvoice(
//           customerId,
//           oneTimeProducts,
//           stripeAccessToken,
//           dealId
//         );
//         if (invoice) {
//           console.log(
//             `📩 Invoice created for Customer ${customerId}: ${invoice.id}`
//           );
//           responseData.invoices.push({
//             id: invoice.id,
//             created_at: new Date(invoice.created * 1000).toISOString(),
//           });
//         } else {
//           console.error(
//             `❌ Failed to create invoice for Customer ${customerId}`
//           );
//         }
//       }

//       // ✅ Process Recurring Products (Subscription)
//       if (recurringProducts.length > 0) {
//         console.log(
//           `🔄 Customer ${customerId} has recurring products. Checking payment method...`
//         );

//         const hasPayment = await hasPaymentMethod(
//           customerId,
//           stripeAccessToken
//         );
//         if (hasPayment) {
//           // ✅ Customer has a payment method → Create subscription
//           console.log(
//             `✅ Customer ${customerId} has a payment method. Creating subscription...`
//           );
//           const subscription = await createStripeSubscription(
//             customerId,
//             recurringProducts,
//             stripeAccessToken,
//             dealId
//           );
//           if (subscription) {
//             console.log(
//               `🔄 Subscription created for Customer ${customerId}: ${subscription.id}`
//             );
//             responseData.subscriptions.push({
//               id: subscription.id,
//               created_at: new Date(subscription.created * 1000).toISOString(),
//             });
//           } else {
//             console.error(
//               `❌ Failed to create subscription for Customer ${customerId}`
//             );
//           }
//         } else {
//           console.log(
//             `📩 No payment method found for ${customerId}. Creating subscription with invoice.`
//           );
//           const subscriptionWithInvoice = (await createSubscriptionWithInvoice(
//             customerId,
//             recurringProducts,
//             stripeAccessToken,
//             dealId
//           )) as
//             | {
//                 subscriptionId: string;
//                 subscriptionCreated: number;
//                 invoiceId: string | null;
//                 invoiceCreated: number | null;
//               }
//             | {
//                 subscriptionId: string;
//                 subscriptionCreated: number;
//                 invoiceId: string | null;
//                 invoiceCreated: number | null;
//               }[];

//           if (subscriptionWithInvoice) {
//             console.log(
//               `📩 Subscription with invoice created for Customer ${customerId}`
//             );

//             if (!responseData.subscriptions) {
//               responseData.subscriptions = [];
//             }
//             if (!responseData.invoices) {
//               responseData.invoices = [];
//             }

//             if (Array.isArray(subscriptionWithInvoice)) {
//               subscriptionWithInvoice.forEach((sub) => {
//                 responseData.subscriptions.push({
//                   id: sub.subscriptionId,
//                   created_at: new Date(
//                     sub.subscriptionCreated * 1000
//                   ).toISOString(), // ✅ Use correct subscription timestamp
//                 });

//                 if (sub.invoiceId && sub.invoiceCreated !== null) {
//                   // ✅ Ensure invoiceCreated is not null
//                   responseData.invoices.push({
//                     id: sub.invoiceId,
//                     created_at: new Date(
//                       sub.invoiceCreated * 1000
//                     ).toISOString(), // ✅ Safe conversion
//                   });
//                 } else if (sub.invoiceId) {
//                   responseData.invoices.push({
//                     id: sub.invoiceId,
//                     created_at: "", // ✅ Handle the case where invoiceCreated is null
//                   });
//                 }
//               });
//             } else {
//               responseData.subscriptions.push({
//                 id: subscriptionWithInvoice.subscriptionId,
//                 created_at: new Date(
//                   subscriptionWithInvoice.subscriptionCreated * 1000
//                 ).toISOString(), // ✅ Use correct subscription timestamp
//               });

//               if (
//                 subscriptionWithInvoice.invoiceId &&
//                 subscriptionWithInvoice.invoiceCreated !== null
//               ) {
//                 responseData.invoices.push({
//                   id: subscriptionWithInvoice.invoiceId,
//                   created_at: new Date(
//                     subscriptionWithInvoice.invoiceCreated * 1000
//                   ).toISOString(), // ✅ Safe conversion
//                 });
//               } else if (subscriptionWithInvoice.invoiceId) {
//                 responseData.invoices.push({
//                   id: subscriptionWithInvoice.invoiceId,
//                   created_at: "", // ✅ Handle null timestamp gracefully
//                 });
//               }
//             }
//           } else {
//             console.error(
//               `❌ Failed to create subscription with invoice for Customer ${customerId}`
//             );
//           }
//         }
//       }

//       // ✅ Process Usage-Based Products (Metered Billing)
//       if (usageBasedProducts.length > 0) {
//         console.log(
//           `📊 Customer ${customerId} has usage-based products. Creating metered billing...`
//         );

//         const subscriptionWithInvoice =
//           (await createSubscriptionWithInvoiceUsageBased(
//             customerId,
//             usageBasedProducts,
//             stripeAccessToken,
//             dealId
//           )) as
//             | {
//                 subscriptionId: string;
//                 subscriptionCreated: number;
//                 invoiceId: string | null;
//                 invoiceCreated: number | null;
//               }
//             | {
//                 subscriptionId: string;
//                 subscriptionCreated: number;
//                 invoiceId: string | null;
//                 invoiceCreated: number | null;
//               }[];

//         if (subscriptionWithInvoice) {
//           console.log(
//             `📩 Subscription with invoice created for Customer ${customerId}`
//           );

//           if (!responseData.subscriptions) {
//             responseData.subscriptions = [];
//           }
//           if (!responseData.invoices) {
//             responseData.invoices = [];
//           }

//           if (Array.isArray(subscriptionWithInvoice)) {
//             subscriptionWithInvoice.forEach((sub) => {
//               responseData.subscriptions.push({
//                 id: sub.subscriptionId,
//                 created_at: new Date(
//                   sub.subscriptionCreated * 1000
//                 ).toISOString(), // ✅ Use correct subscription timestamp
//               });

//               if (sub.invoiceId && sub.invoiceCreated !== null) {
//                 // ✅ Ensure invoiceCreated is not null
//                 responseData.invoices.push({
//                   id: sub.invoiceId,
//                   created_at: new Date(sub.invoiceCreated * 1000).toISOString(), // ✅ Safe conversion
//                 });
//               } else if (sub.invoiceId) {
//                 responseData.invoices.push({
//                   id: sub.invoiceId,
//                   created_at: "", // ✅ Handle the case where invoiceCreated is null
//                 });
//               }
//             });
//           } else {
//             responseData.subscriptions.push({
//               id: subscriptionWithInvoice.subscriptionId,
//               created_at: new Date(
//                 subscriptionWithInvoice.subscriptionCreated * 1000
//               ).toISOString(), // ✅ Use correct subscription timestamp
//             });

//             if (
//               subscriptionWithInvoice.invoiceId &&
//               subscriptionWithInvoice.invoiceCreated !== null
//             ) {
//               responseData.invoices.push({
//                 id: subscriptionWithInvoice.invoiceId,
//                 created_at: new Date(
//                   subscriptionWithInvoice.invoiceCreated * 1000
//                 ).toISOString(), // ✅ Safe conversion
//               });
//             } else if (subscriptionWithInvoice.invoiceId) {
//               responseData.invoices.push({
//                 id: subscriptionWithInvoice.invoiceId,
//                 created_at: "", // ✅ Handle null timestamp gracefully
//               });
//             }
//           }
//         } else {
//           console.error(
//             `❌ Failed to create subscription with invoice for Customer ${customerId}`
//           );
//         }
//       }

//       // ✅ Handle Case Where No Stripe Products Exist
//       if (products.length == 0) {
//         console.log(
//           `📩 No Stripe products found for ${customerId}. Creating a manual invoice for ${amount}...`
//         );
//         const manualInvoice = await createManualInvoice(
//           customerId,
//           amount,
//           stripeAccessToken,
//           dealId
//         );
//         if (manualInvoice) {
//           console.log(
//             `📩 Manual invoice created for Customer ${customerId}: ${manualInvoice.id}`
//           );
//           responseData.invoices.push({
//             id: manualInvoice.id,
//             created_at: new Date().toISOString(), // ✅ Store UTC time
//           });
//         } else {
//           console.error(
//             `❌ Failed to create manual invoice for Customer ${customerId}`
//           );
//         }
//       }
//     }

//     // ✅ Return all collected invoice and subscription IDs
//     return responseData;
//   } catch (error) {
//     console.error("❌ Error processing Stripe payments:", error);
//     return null;
//   }
// };





// const processStripePayments = async (dealData, stripeAccessToken) => {
//   try {
//     console.log(
//       "🔹 Processing Stripe Payments:",
//       JSON.stringify(dealData, null, 2)
//     );

//     const { dealId, customer, products, amount } = dealData;

//     // ✅ Explicitly define responseData with correct types
//     const responseData: {
//       dealId: string;
//       invoices: string[];
//       subscriptions: string[];
//       amount: number;
//     } = {
//       dealId: dealId,
//       invoices: [],
//       subscriptions: [],
//       amount: amount,
//     };

//     for (const customerId of customer) {
//       console.log(`✅ Processing for Customer: ${customerId}`);

//       if (!products) {
//         console.log(
//           `📩 No Stripe products found for ${customerId}. Creating a manual invoice for ${amount}...`
//         );
//         const manualInvoice = await createManualInvoice(
//           customerId,
//           amount,
//           stripeAccessToken,
//           dealId
//         );
//         if (manualInvoice) {
//           console.log(
//             `📩 Manual invoice created for Customer ${customerId}: ${manualInvoice.id}`
//           );
//           responseData.invoices.push(manualInvoice.id); // ✅ Collect Manual Invoice ID
//           return responseData;
//         } else {
//           console.error(
//             `❌ Failed to create manual invoice for Customer ${customerId}`
//           );
//         }
//       }

//       // ✅ Separate one-time and recurring products
//       const oneTimeProducts = products.filter(
//         (product) => product.type === "one_time"
//       );
//       const recurringProducts = products.filter(
//         (product) => product.type === "recurring"
//       );

//       // ✅ Process One-Time Products (Invoice)
//       if (oneTimeProducts.length > 0) {
//         console.log(
//           `💰 Customer ${customerId} has one-time products. Creating invoice...`
//         );
//         const invoice = await createStripeInvoice(
//           customerId,
//           oneTimeProducts,
//           stripeAccessToken,
//           dealId
//         );
//         if (invoice) {
//           console.log(
//             `📩 Invoice created for Customer ${customerId}: ${invoice.id}`
//           );
//           responseData.invoices.push(invoice.id); // ✅ Collect Invoice ID
//         } else {
//           console.error(
//             `❌ Failed to create invoice for Customer ${customerId}`
//           );
//         }
//       }

//       // ✅ Process Recurring Products (Subscription)
//       if (recurringProducts.length > 0) {
//         console.log(
//           `🔄 Customer ${customerId} has recurring products. Checking payment method...`
//         );

//         const hasPayment = await hasPaymentMethod(
//           customerId,
//           stripeAccessToken
//         );
//         if (hasPayment) {
//           // ✅ Customer has a payment method → Create subscription
//           console.log(
//             `✅ Customer ${customerId} has a payment method. Creating subscription...`
//           );
//           const subscription = await createStripeSubscription(
//             customerId,
//             recurringProducts,
//             stripeAccessToken,
//             dealId
//           );
//           if (subscription) {
//             console.log(
//               `🔄 Subscription created for Customer ${customerId}: ${subscription.id}`
//             );
//             responseData.subscriptions.push(subscription.id); // ✅ Collect Subscription ID
//           } else {
//             console.error(
//               `❌ Failed to create subscription for Customer ${customerId}`
//             );
//           }
//         } else {
//           console.log(
//             `📩 No payment method found for ${customerId}. Creating subscription with invoice.`
//           );
//           const subscriptionWithInvoice = (await createSubscriptionWithInvoice(
//             customerId,
//             recurringProducts,
//             stripeAccessToken,
//             dealId
//           )) as
//             | { subscriptionId: string; invoiceId: string | null }
//             | { subscriptionId: string; invoiceId: string | null }[];

//           if (subscriptionWithInvoice) {
//             console.log(
//               `📩 Subscription with invoice created for Customer ${customerId}`
//             );

//             if (!responseData.subscriptions) {
//               responseData.subscriptions = [];
//             }
//             if (!responseData.invoices) {
//               responseData.invoices = [];
//             }

//             // ✅ If the response is an array, loop through and collect IDs
//             if (Array.isArray(subscriptionWithInvoice)) {
//               subscriptionWithInvoice.forEach((sub) => {
//                 responseData.subscriptions.push(sub.subscriptionId);
//                 if (sub.invoiceId) {
//                   responseData.invoices.push(sub.invoiceId);
//                 }
//               });
//             } else {
//               // ✅ If it's a single subscription, push the IDs
//               responseData.subscriptions.push(
//                 subscriptionWithInvoice.subscriptionId
//               );
//               if (subscriptionWithInvoice.invoiceId) {
//                 responseData.invoices.push(subscriptionWithInvoice.invoiceId);
//               }
//             }
//           } else {
//             console.error(
//               `❌ Failed to create subscription with invoice for Customer ${customerId}`
//             );
//           }
//         }
//       }

//       // ✅ Handle Case Where No Stripe Products Exist
//       if (products.length == 0) {
//         console.log(
//           `📩 No Stripe products found for ${customerId}. Creating a manual invoice for ${amount}...`
//         );
//         const manualInvoice = await createManualInvoice(
//           customerId,
//           amount,
//           stripeAccessToken,
//           dealId
//         );
//         if (manualInvoice) {
//           console.log(
//             `📩 Manual invoice created for Customer ${customerId}: ${manualInvoice.id}`
//           );
//           responseData.invoices.push(manualInvoice.id); // ✅ Collect Manual Invoice ID
//         } else {
//           console.error(
//             `❌ Failed to create manual invoice for Customer ${customerId}`
//           );
//         }
//       }
//     }

//     // ✅ Return all collected invoice and subscription IDs
//     return responseData;
//   } catch (error) {
//     console.error("❌ Error processing Stripe payments:", error);
//     return null;
//   }
// };

// const createManualInvoice = async (
//   customerId,
//   amount,
//   stripeAccessToken,
//   dealId
// ) => {
//   console.log("inside manual");
//   console.log(amount + " amount before " + typeof amount);
//   amount = Number(amount);
//   try {
//     const stripe = await stripeInstance(stripeAccessToken);

//     // ✅ Step 1: Create an Invoice Item
//     const invoiceItem = await stripe.invoiceItems.create({
//       customer: customerId,
//       amount: Math.round(amount * 100), // Stripe expects amounts in cents
//       currency: "usd",
//       description: `Invoice for Deal`,
//       metadata: {
//         // ✅ Add metadata to individual invoice items
//         deal_id: dealId,
//       },
//     });

//     console.log(
//       `📄 Invoice item created for Customer ${customerId}: ${invoiceItem.id}`
//     );

//     // ✅ Step 2: Create the Invoice
//     const invoice = await stripe.invoices.create({
//       customer: customerId,
//       collection_method: "send_invoice", // ✅ Sends invoice instead of charging automatically
//       days_until_due: 7, // ✅ Invoice is due in 7 days
//       auto_advance: true, // ✅ Finalize invoice immediately
//     });

//     console.log(
//       `📩 Manual invoice created for Customer ${customerId}: ${invoice.id}`
//     );
//     const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
//     console.log(
//       `📨 Invoice finalized and sent immediately: ${finalizedInvoice.id}`
//     );
//     return invoice;
//   } catch (error) {
//     console.error(
//       `❌ Error creating manual invoice for customer ${customerId}:`,
//       error
//     );
//     return null;
//   }
// };



const processStripePayments = async (
  dealData: {
    dealId: string;
    customer: string[];
    products?: {
      stripeProductId: string;
      stripePriceId: string;
      type: string;
      interval?: string;
      interval_count?: number;
      quantity: number;
    }[];
    amount: number;
  },
  stripeAccessToken: string
): Promise<{
  dealId: string;
  invoices: { id: string; created_at: string }[];
  subscriptions: { id: string; created_at: string }[];
  amount: number;
} | null> => {
  try {
    console.log("🔹 Processing Stripe Payments:", JSON.stringify(dealData, null, 2));

    const { dealId, customer, products = [], amount } = dealData;

    const responseData = {
      dealId: dealId,
      invoices: [] as { id: string; created_at: string }[],
      subscriptions: [] as { id: string; created_at: string }[],
      amount: amount,
    };

    for (const customerId of customer) {
      console.log(`✅ Processing for Customer: ${customerId}`);

      if (products.length === 0) {
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
          console.log(`📩 Manual invoice created for Customer ${customerId}: ${manualInvoice.id}`);
          responseData.invoices.push({
            id: manualInvoice.id,
            created_at: new Date(manualInvoice.created * 1000).toISOString(),
          });
          return responseData;
        } else {
          console.error(`❌ Failed to create manual invoice for Customer ${customerId}`);
        }
      }

      const oneTimeProducts = products
        .filter((product) => product.type === "one_time")
        .map((product) => ({
          ...product,
          interval: product.interval || "month", // ✅ Provide default interval
          interval_count: product.interval_count ?? 1, // ✅ Provide default interval_count
        }));

      const recurringOrUsageBasedProducts = products
        .filter((product) => product.type === "recurring" || product.type === "usage_based")
        .map((product) => ({
          ...product,
          interval: product.interval || "month", // ✅ Ensure interval is always defined
          interval_count: product.interval_count ?? 1, // ✅ Ensure interval_count is always defined
        }));

      if (oneTimeProducts.length > 0) {
        console.log(`💰 Customer ${customerId} has one-time products. Creating invoice...`);
        const invoice = await createStripeInvoice(
          customerId,
          oneTimeProducts,
          stripeAccessToken,
          dealId
        );
        if (invoice) {
          console.log(`📩 Invoice created for Customer ${customerId}: ${invoice.id}`);
          responseData.invoices.push({
            id: invoice.id,
            created_at: new Date(invoice.created * 1000).toISOString(),
          });
        } else {
          console.error(`❌ Failed to create invoice for Customer ${customerId}`);
        }
      }

      if (recurringOrUsageBasedProducts.length > 0) {
        console.log(`🔄 Customer ${customerId} has recurring or usage-based products.`);

        const hasPayment = await hasPaymentMethod(customerId, stripeAccessToken);
        const subscriptionWithInvoice = await createSubscriptionWithInvoiceCombined(
          customerId,
          recurringOrUsageBasedProducts,
          stripeAccessToken,
          dealId
        );

        if (subscriptionWithInvoice.length > 0) {
          console.log(`📩 Subscription with invoice created for Customer ${customerId}`);

          subscriptionWithInvoice.forEach((sub) => {
            responseData.subscriptions.push({
              id: sub.subscriptionId,
              created_at: new Date(sub.subscriptionCreated * 1000).toISOString(),
            });

            if (sub.invoiceId && sub.invoiceCreated !== null) {
              responseData.invoices.push({
                id: sub.invoiceId,
                created_at: new Date(sub.invoiceCreated * 1000).toISOString(),
              });
            } else if (sub.invoiceId) {
              responseData.invoices.push({
                id: sub.invoiceId,
                created_at: "",
              });
            }
          });
        } else {
          console.error(`❌ Failed to create subscription with invoice for Customer ${customerId}`);
        }
      }
    }

    return responseData;
  } catch (error) {
    console.error("❌ Error processing Stripe payments:", error);
    return null;
  }
};






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

    console.log("Creating a new invoice...");
    const invoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: "send_invoice", // ✅ Sends invoice instead of charging automatically
      days_until_due: 7, // ✅ Payment is due in 7 days
      auto_advance: false, // ✅ Prevents auto-finalization before items attach
    });

    console.log(`📩 New invoice created: ${invoice.id}`);

    console.log("Creating invoice item and linking it to the invoice...");
    const invoiceItem = await stripe.invoiceItems.create({
      customer: customerId,
      invoice: invoice.id, // ✅ Attach this item to the new invoice
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      description: "Invoice for Deal",
      metadata: { deal_id: dealId },
    });
    await stripe.invoices.update(invoice.id, {
      metadata: { deal_id: dealId, customer: customerId },
    });
    console.log(
      `📄 Invoice item created: ${invoiceItem.id} and linked to invoice: ${invoice.id}`
    );

    console.log("Fetching invoice before finalizing...");
    let retrievedInvoice = await stripe.invoices.retrieve(invoice.id);
    console.log(`📜 Invoice Line Items:`, retrievedInvoice.lines.data);

    if (retrievedInvoice.lines.data.length === 0) {
      console.log("⚠️ Invoice items not found, waiting before retrying...");
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Small delay
      retrievedInvoice = await stripe.invoices.retrieve(invoice.id);
      console.log(
        `📜 Retried Invoice Line Items:`,
        retrievedInvoice.lines.data
      );
    }

    console.log("Finalizing invoice...");
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
    console.log(`📨 Invoice finalized: ${finalizedInvoice.id}`);

    console.log("Retrieving updated invoice...");
    const updatedInvoice = await stripe.invoices.retrieve(finalizedInvoice.id);
    console.log(`✅ Final Invoice Total: ${updatedInvoice.total / 100} USD`);

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
  return false;
  // try {
  //   const stripe = stripeInstance(stripeAccessToken);
  //   const customer = await stripe.customers.retrieve(customerId);

  //   if (
  //     "invoice_settings" in customer &&
  //     customer.invoice_settings?.default_payment_method
  //   ) {
  //     console.log(`✅ Customer ${customerId} has a default payment method.`);
  //     return true;
  //   }

  //   console.log(`⚠️ Customer ${customerId} has NO default payment method.`);
  //   return false;
  // } catch (error) {
  //   console.error(
  //     `❌ Error checking payment method for customer ${customerId}:`,
  //     error
  //   );
  //   return false;
  // }
};

// const createStripeInvoice = async (
//   customerId,
//   products,
//   stripeAccessToken,
//   dealId
// ) => {
//   console.log("inside createStripeInvoice");
//   try {
//     const stripe = stripeInstance(stripeAccessToken);
//     const invoiceItems = [] as any[];

//     for (const product of products) {
//       if (product.type === "one_time" || product.type === "recurring") {
//         console.log(product.stripePriceId + "price id");
//         const invoiceItem = await stripe.invoiceItems.create({
//           customer: customerId,
//           price: product.stripePriceId,
//           quantity: product.quantity,
//           metadata: {
//             // ✅ Add metadata to individual invoice items
//             deal_id: dealId,
//             product_id: product.stripeProductId,
//           },
//         });
//         invoiceItems.push(invoiceItem);
//       }
//       else{
//         console.log("product type not found");
//       }
//     }

//     // ✅ Step 1: Create Invoice
//     let invoice = await stripe.invoices.create({
//       customer: customerId,
//       collection_method: "send_invoice",
//       days_until_due: 7, // Send invoice instead of charging automatically
//       auto_advance: true, // Let Stripe send the invoice
//     });

//     console.log(`📩 Invoice created for Customer ${customerId}: ${invoice.id}`);

//     // ✅ Step 2: Add Metadata to Invoice Before Finalizing
//     invoice = await stripe.invoices.update(invoice.id, {
//       metadata: {
//         deal_id: dealId, // ✅ Same metadata as invoice items
//         customer_id: customerId,
//       },
//     });

//     console.log(`📝 Metadata added to Invoice ${invoice.id}`);

//     // ✅ Step 3: Finalize the Invoice
//     const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
//     console.log(`📨 Invoice finalized and sent immediately: ${finalizedInvoice.id}`);

//     return finalizedInvoice; // ✅ Return the finalized invoice
//   } catch (error) {
//     console.error(`❌ Error creating invoice for customer ${customerId}:`, error);
//     return null;
//   }
// };

const createStripeInvoice = async (
  customerId,
  products,
  stripeAccessToken,
  dealId
) => {
  console.log("inside createStripeInvoice");
  try {
    const stripe = stripeInstance(stripeAccessToken);

    // ✅ Step 1: Create the Invoice FIRST
    let invoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: "send_invoice",
      days_until_due: 7, // Send invoice instead of charging automatically
      auto_advance: false, // ✅ Prevent auto-finalization before items attach
    });

    console.log(`📩 Invoice created for Customer ${customerId}: ${invoice.id}`);

    const invoiceItems = [] as any[];

    // ✅ Step 2: Now Create Invoice Items and Attach to the Invoice
    for (const product of products) {
      if (product.type === "one_time" || product.type === "recurring") {
        console.log(
          `🛒 Adding Product to Invoice - Price ID: ${product.stripePriceId}, Quantity: ${product.quantity}`
        );

        const invoiceItem = await stripe.invoiceItems.create({
          customer: customerId,
          price: product.stripePriceId,
          quantity: product.quantity,
          invoice: invoice.id, // ✅ Assign to the created invoice
          metadata: {
            deal_id: dealId,
            product_id: product.stripeProductId,
          },
        });

        console.log(
          `✅ Invoice Item Created: ${invoiceItem.id} | Amount: ${invoiceItem.amount} | Invoice ID: ${invoiceItem.invoice}`
        );
        invoiceItems.push(invoiceItem);
      } else {
        console.log("⚠️ Product type not found");
      }
    }

    // ✅ Step 3: Add Metadata to Invoice Before Finalizing
    invoice = await stripe.invoices.update(invoice.id, {
      metadata: {
        deal_id: dealId, // ✅ Same metadata as invoice items
        customer_id: customerId,
      },
    });

    console.log(`📝 Metadata added to Invoice ${invoice.id}`);

    // ✅ Step 4: Finalize the Invoice AFTER Attaching Items
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
    console.log(
      `📨 Invoice Finalized with Total: ${finalizedInvoice.total} | Status: ${finalizedInvoice.status}`
    );

    return finalizedInvoice; // ✅ Return the finalized invoice
  } catch (error) {
    console.error(
      `❌ Error creating invoice for customer ${customerId}:`,
      error
    );
    return null;
  }
};

const createStripeUsageBasedSubscription = async (
  customerId,
  products,
  stripeAccessToken,
  dealId
) => {
  try {
    console.log("inside createStripeUsageBasedSubscription");
    const stripe = stripeInstance(stripeAccessToken);

    const subscriptionItems = products
      .filter((product) => product.type === "usage_based")
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
      `🔄 Usage-Based Subscription created for customer ${customerId}: ${subscription.id}`
    );
    return subscription;
  } catch (error) {
    console.error(
      `❌ Error creating usage-based subscription for customer ${customerId}:`,
      error
    );
    return null;
  }
};

const createSubscriptionWithInvoiceUsageBased = async (
  customerId,
  products,
  stripeAccessToken,
  dealId
) => {
  try {
    console.log("inside createSubscriptionWithInvoiceUsageBased");
    const stripe = stripeInstance(stripeAccessToken);

    const groupedProducts: Record<string, Stripe.SubscriptionCreateParams.Item[]> = products
    .filter((product) => product.type === "usage_based")
    .reduce((groups, product) => {
      const key = `${product.interval}-${product.interval_count}`;
  
      if (!groups[key]) {
        groups[key] = [];
      }
  
      // Handle multiple prices
      const priceIds = product.stripePriceId.includes(",") 
        ? product.stripePriceId.split(",").map(price => price.trim()) 
        : [product.stripePriceId];
  
      priceIds.forEach(priceId => {
        groups[key].push({
          price: priceId,
        });
      });
  
      return groups;
    }, {} as Record<string, Stripe.SubscriptionCreateParams.Item[]>);
  

    console.log("🚀 => groupedProducts:", groupedProducts);

    const createdSubscriptions: {
      subscriptionId: string;
      subscriptionCreated: number; // ✅ Store subscription created timestamp
      invoiceId: string | null;
      invoiceCreated: number | null; // ✅ Store invoice created timestamp
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

      // ✅ Extract Subscription Created Timestamp
      const subscriptionCreated = subscription.created;

      // ✅ Extract Invoice ID and Created Timestamp
      let invoiceId: string | null | undefined = null;
      let invoiceCreated: number | null = null;

      if (typeof subscription.latest_invoice === "string") {
        invoiceId = subscription.latest_invoice;
      } else if (
        subscription.latest_invoice &&
        "id" in subscription.latest_invoice
      ) {
        invoiceId = subscription.latest_invoice.id;
        invoiceCreated = subscription.latest_invoice.created; // ✅ Get invoice created timestamp
      }

      // ✅ Add Metadata to Invoice and Finalize
      if (invoiceId) {
        console.log(`📩 Updating invoice ${invoiceId} with metadata...`);

        await stripe.invoices.update(invoiceId, {
          metadata: {
            deal_id: dealId,
            subscription_id: subscription.id,
          },
        });

        // ✅ Finalize the invoice
        const finalizedInvoice = await stripe.invoices.finalizeInvoice(
          invoiceId
        );

        console.log(
          `📨 Invoice finalized and sent immediately: ${finalizedInvoice.id}`
        );

        // ✅ Ensure we get the correct created timestamp
        invoiceCreated = finalizedInvoice.created;
      } else {
        console.warn(
          `⚠️ No invoice found for subscription: ${subscription.id}`
        );
      }

      // ✅ Collect Subscription and Invoice Data
      createdSubscriptions.push({
        subscriptionId: subscription.id,
        subscriptionCreated, // ✅ Store Subscription Created Timestamp
        invoiceId,
        invoiceCreated, // ✅ Store Invoice Created Timestamp
      });
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



// const createSubscriptionWithInvoiceCombined = async (
//   customerId: string,
//   products: {
//     stripeProductId: string;
//     stripePriceId: string;
//     type: string;
//     interval: string;
//     interval_count: number;
//     quantity: number;
//   }[],
//   stripeAccessToken: string,
//   dealId: string
// ): Promise<
//   {
//     subscriptionId: string;
//     subscriptionCreated: number;
//     invoiceId: string | null;
//     invoiceCreated: number | null;
//   }[]
// > => {
//   try {
//     console.log("inside createSubscriptionWithInvoiceCombined");
//     const stripe = stripeInstance(stripeAccessToken);

//     const groupedProducts: Record<string, Stripe.SubscriptionCreateParams.Item[]> =
//       products.reduce((groups, product) => {
//         const key = `${product.interval}-${product.interval_count}`;
//         if (!groups[key]) {
//           groups[key] = [];
//         }
//         const priceIds = product.stripePriceId.includes(",")
//           ? product.stripePriceId.split(",").map((price) => price.trim())
//           : [product.stripePriceId];

//         priceIds.forEach((priceId) => {
//           groups[key].push({
//             price: priceId,
//             quantity: product.quantity,
//           });
//         });

//         return groups;
//       }, {} as Record<string, Stripe.SubscriptionCreateParams.Item[]>);

//     console.log("🚀 Grouped Products:", groupedProducts);

//     const createdSubscriptions: {
//       subscriptionId: string;
//       subscriptionCreated: number;
//       invoiceId: string | null;
//       invoiceCreated: number | null;
//     }[] = [];

//     for (const [interval, subscriptionItems] of Object.entries(groupedProducts)) {
//       console.log(`🔄 Creating subscription for billing interval: ${interval}`);

//       const subscription = await stripe.subscriptions.create({
//         customer: customerId,
//         items: subscriptionItems,
//         collection_method: "send_invoice",
//         days_until_due: 7,
//         expand: ["latest_invoice.payment_intent"],
//         metadata: {
//           deal_id: dealId,
//           billing_interval: interval,
//           created_by: "HubSpot Integration",
//         },
//       });

//       console.log(
//         `📩 Subscription created for customer ${customerId}: ${subscription.id}`
//       );

//       const subscriptionCreated = subscription.created;
//       let invoiceId: string | null = null;
//       let invoiceCreated: number | null = null;

//       if (typeof subscription.latest_invoice === "string") {
//         invoiceId = subscription.latest_invoice;
//       } else if (subscription.latest_invoice && "id" in subscription.latest_invoice) {
//         invoiceId = subscription.latest_invoice.id;
//         invoiceCreated = subscription.latest_invoice.created;
//       }

//       if (invoiceId) {
//         console.log(`📩 Updating invoice ${invoiceId} with metadata...`);

//         await stripe.invoices.update(invoiceId, {
//           metadata: {
//             deal_id: dealId,
//             subscription_id: subscription.id,
//           },
//         });

//         const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoiceId);

//         console.log(`📨 Invoice finalized and sent: ${finalizedInvoice.id}`);

//         invoiceCreated = finalizedInvoice.created;
//       } else {
//         console.warn(`⚠️ No invoice found for subscription: ${subscription.id}`);
//       }

//       createdSubscriptions.push({
//         subscriptionId: subscription.id,
//         subscriptionCreated,
//         invoiceId,
//         invoiceCreated,
//       });
//     }

//     return createdSubscriptions;
//   } catch (error) {
//     console.error(
//       `❌ Error creating subscription with invoice for customer ${customerId}:`,
//       error
//     );
//     return [];
//   }
// };


// const createSubscriptionWithInvoiceCombined = async (
//   customerId: string,
//   products: {
//     stripeProductId: string;
//     stripePriceId: string;
//     type: string;
//     interval: string;
//     interval_count: number;
//     quantity: number;
//   }[],
//   stripeAccessToken: string,
//   dealId: string
// ): Promise<
//   {
//     subscriptionId: string;
//     subscriptionCreated: number;
//     invoiceId: string | null;
//     invoiceCreated: number | null;
//   }[]
// > => {
//   try {
//     console.log("inside createSubscriptionWithInvoiceCombined");
//     const stripe = stripeInstance(stripeAccessToken);

//     const groupedProducts: Record<string, Stripe.SubscriptionCreateParams.Item[]> =
//       products.reduce((groups, product) => {
//         const key = `${product.interval}-${product.interval_count}`;
//         if (!groups[key]) {
//           groups[key] = [];
//         }
//         const priceIds = product.stripePriceId.includes(",")
//           ? product.stripePriceId.split(",").map((price) => price.trim())
//           : [product.stripePriceId];

//         priceIds.forEach((priceId) => {
//           // ✅ If the product is NOT usage-based, add quantity
//           const subscriptionItem: Stripe.SubscriptionCreateParams.Item = { price: priceId };

//           if (product.type !== "usage_based") {
//             subscriptionItem.quantity = product.quantity; // ✅ Add quantity only for non-metered plans
//           }

//           groups[key].push(subscriptionItem);
//         });

//         return groups;
//       }, {} as Record<string, Stripe.SubscriptionCreateParams.Item[]>);

//     console.log("🚀 Grouped Products:", JSON.stringify(groupedProducts, null, 2));

//     const createdSubscriptions: {
//       subscriptionId: string;
//       subscriptionCreated: number;
//       invoiceId: string | null;
//       invoiceCreated: number | null;
//     }[] = [];

//     for (const [interval, subscriptionItems] of Object.entries(groupedProducts)) {
//       console.log(`🔄 Creating subscription for billing interval: ${interval}`);

//       const subscription = await stripe.subscriptions.create({
//         customer: customerId,
//         items: subscriptionItems,
//         collection_method: "send_invoice",
//         days_until_due: 7,
//         expand: ["latest_invoice.payment_intent"],
//         metadata: {
//           deal_id: dealId,
//           billing_interval: interval,
//           created_by: "HubSpot Integration",
//         },
//       });

//       console.log(
//         `📩 Subscription created for customer ${customerId}: ${subscription.id}`
//       );

//       const subscriptionCreated = subscription.created;
//       let invoiceId: string | null = null;
//       let invoiceCreated: number | null = null;

//       if (typeof subscription.latest_invoice === "string") {
//         invoiceId = subscription.latest_invoice;
//       } else if (subscription.latest_invoice && "id" in subscription.latest_invoice) {
//         invoiceId = subscription.latest_invoice.id;
//         invoiceCreated = subscription.latest_invoice.created;
//       }

//       if (invoiceId) {
//         console.log(`📩 Updating invoice ${invoiceId} with metadata...`);

//         await stripe.invoices.update(invoiceId, {
//           metadata: {
//             deal_id: dealId,
//             subscription_id: subscription.id,
//           },
//         });

//         const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoiceId);

//         console.log(`📨 Invoice finalized and sent: ${finalizedInvoice.id}`);

//         invoiceCreated = finalizedInvoice.created;
//       } else {
//         console.warn(`⚠️ No invoice found for subscription: ${subscription.id}`);
//       }

//       createdSubscriptions.push({
//         subscriptionId: subscription.id,
//         subscriptionCreated,
//         invoiceId,
//         invoiceCreated,
//       });
//     }

//     return createdSubscriptions;
//   } catch (error) {
//     console.error(
//       `❌ Error creating subscription with invoice for customer ${customerId}:`,
//       error
//     );
//     return [];
//   }
// };


const createSubscriptionWithInvoiceCombined = async (
  customerId: string,
  products: {
    stripeProductId: string;
    stripePriceId: string;
    type: string;
    interval: string;
    interval_count: number;
    quantity: number;
  }[],
  stripeAccessToken: string,
  dealId: string
): Promise<
  {
    subscriptionId: string;
    subscriptionCreated: number;
    invoiceId: string | null;
    invoiceCreated: number | null;
  }[]
> => {
  try {
    console.log("inside createSubscriptionWithInvoiceCombined");
    const stripe = stripeInstance(stripeAccessToken);

    // 🚀 Step 1: Group products properly to prevent duplicate subscriptions
    const groupedProducts: Record<string, Stripe.SubscriptionCreateParams.Item[]> =
      products.reduce((groups, product) => {
        const key = `${product.interval}-${product.interval_count}`;
        if (!groups[key]) {
          groups[key] = [];
        }

        // ✅ Ensure multiple price IDs are handled in the same subscription
        const priceIds = product.stripePriceId.includes(",")
          ? product.stripePriceId.split(",").map((price) => price.trim())
          : [product.stripePriceId];

        priceIds.forEach((priceId) => {
          const subscriptionItem: Stripe.SubscriptionCreateParams.Item = { price: priceId };

          if (product.type !== "usage_based") {
            subscriptionItem.quantity = product.quantity; // ✅ Only for non-metered plans
          }

          groups[key].push(subscriptionItem);
        });

        return groups;
      }, {} as Record<string, Stripe.SubscriptionCreateParams.Item[]>);

    console.log("🚀 Grouped Products:", JSON.stringify(groupedProducts, null, 2));

    const createdSubscriptions: {
      subscriptionId: string;
      subscriptionCreated: number;
      invoiceId: string | null;
      invoiceCreated: number | null;
    }[] = [];

    // 🚀 Step 2: Check if a subscription already exists before creating a new one
    for (const [interval, subscriptionItems] of Object.entries(groupedProducts)) {
      console.log(`🔄 Creating subscription for billing interval: ${interval}`);
      console.log("Here is the customer ID  "+ customerId);
      // ⚠️ Add validation to check existing subscriptions before creating a new one
      const existingSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
      });

      // console.log("Existing Subscriptions: ", JSON.stringify(existingSubscriptions));
      // ✅ If a subscription with the same interval already exists, skip creating a new one
      const existingSubscription = existingSubscriptions.data.find((sub) => {
        return sub.metadata.deal_id === dealId && sub.metadata.billing_interval === interval;
      });

      if (existingSubscription) {
        console.warn(`⚠️ Subscription already exists for ${customerId} and interval ${interval}, skipping...`);
        continue;
      }
      else{
        console.log("No existing subscription found");
      }

      // ✅ Now create a new subscription only if it doesn't already exist
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
        `📩 Subscription created for customer ${customerId}: ${subscription.id}`
      );

      const subscriptionCreated = subscription.created;
      let invoiceId: string | null = null;
      let invoiceCreated: number | null = null;

      if (typeof subscription.latest_invoice === "string") {
        invoiceId = subscription.latest_invoice;
      } else if (subscription.latest_invoice && "id" in subscription.latest_invoice) {
        invoiceId = subscription.latest_invoice.id;
        invoiceCreated = subscription.latest_invoice.created;
      }

      if (invoiceId) {
        console.log(`📩 Updating invoice ${invoiceId} with metadata...`);

        await stripe.invoices.update(invoiceId, {
          metadata: {
            deal_id: dealId,
            subscription_id: subscription.id,
          },
        });

        const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoiceId);

        console.log(`📨 Invoice finalized and sent: ${finalizedInvoice.id}`);

        invoiceCreated = finalizedInvoice.created;
      } else {
        console.warn(`⚠️ No invoice found for subscription: ${subscription.id}`);
      }

      createdSubscriptions.push({
        subscriptionId: subscription.id,
        subscriptionCreated,
        invoiceId,
        invoiceCreated,
      });
    }

    return createdSubscriptions;
  } catch (error) {
    console.error(
      `❌ Error creating subscription with invoice for customer ${customerId}:`,
      error
    );
    return [];
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

const updateStripeSubscriptionWithUsage = async (
  subscriptionId,
  usageQuantity,
  stripeAccessToken
) => {
  try {
    console.log(`📊 Updating usage for Subscription Item: ${subscriptionId}`);

    const stripe = stripeInstance(stripeAccessToken);

    const subscriptionItem = await stripe.subscriptions.retrieve(
      subscriptionId
    );
    console.log("🚀 => subscriptionItem:", JSON.stringify(subscriptionItem));

    // ✅ Step 1: Check if Subscription Item is valid
    if (!subscriptionItem) {
      console.warn(`⚠️ Subscription Item not found: ${subscriptionId}`);
      return null;
    }

    const subscriptionItemId = subscriptionItem.items.data[0].id;
    // remove _meter and add _event in last
    const meterName =
      subscriptionItem.items.data[0].price.metadata.meterName.replace(
        "_meter",
        "_event"
      );

    // ✅ Step 2: Create Usage Record
    const usageRecord = await stripe.billing.meterEvents.create({
      event_name: meterName,
      payload: {
        value: usageQuantity,
        stripe_customer_id: subscriptionItem.customer as string,
      },
      // subscription_item: subscriptionItemId,
      // amount: usageQuantity, // Number of units used
      timestamp: Math.floor(Date.now() / 1000), // Current timestamp
    });

    console.log(`✅ Usage recorded successfully:`, usageRecord);

    return usageRecord;
  } catch (error) {
    console.error(`❌ Error updating usage record:`, error);
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

        groups[key].push({
          price: product.stripePriceId,
          quantity: product.quantity || 1,
        });
        return groups;
      }, {} as Record<string, Stripe.SubscriptionCreateParams.Item[]>);

    const createdSubscriptions: {
      subscriptionId: string;
      subscriptionCreated: number; // ✅ Store subscription created timestamp
      invoiceId: string | null;
      invoiceCreated: number | null; // ✅ Store invoice created timestamp
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

      // ✅ Extract Subscription Created Timestamp
      const subscriptionCreated = subscription.created;

      // ✅ Extract Invoice ID and Created Timestamp
      let invoiceId: string | null | undefined = null;
      let invoiceCreated: number | null = null;

      if (typeof subscription.latest_invoice === "string") {
        invoiceId = subscription.latest_invoice;
      } else if (
        subscription.latest_invoice &&
        "id" in subscription.latest_invoice
      ) {
        invoiceId = subscription.latest_invoice.id;
        invoiceCreated = subscription.latest_invoice.created; // ✅ Get invoice created timestamp
      }

      // ✅ Add Metadata to Invoice and Finalize
      if (invoiceId) {
        console.log(`📩 Updating invoice ${invoiceId} with metadata...`);

        await stripe.invoices.update(invoiceId, {
          metadata: {
            deal_id: dealId,
            subscription_id: subscription.id,
          },
        });

        // ✅ Finalize the invoice
        const finalizedInvoice = await stripe.invoices.finalizeInvoice(
          invoiceId
        );

        console.log(
          `📨 Invoice finalized and sent immediately: ${finalizedInvoice.id}`
        );

        // ✅ Ensure we get the correct created timestamp
        invoiceCreated = finalizedInvoice.created;
      } else {
        console.warn(
          `⚠️ No invoice found for subscription: ${subscription.id}`
        );
      }

      // ✅ Collect Subscription and Invoice Data
      createdSubscriptions.push({
        subscriptionId: subscription.id,
        subscriptionCreated, // ✅ Store Subscription Created Timestamp
        invoiceId,
        invoiceCreated, // ✅ Store Invoice Created Timestamp
      });
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

// const createSubscriptionWithInvoice = async (
//   customerId,
//   products,
//   stripeAccessToken,
//   dealId
// ) => {
//   try {
//     console.log("inside createSubscriptionWithInvoice");
//     const stripe = stripeInstance(stripeAccessToken);

//     // ✅ Step 1: Group products by `interval` and `interval_count`
//     const groupedProducts: Record<
//       string,
//       Stripe.SubscriptionCreateParams.Item[]
//     > = products
//       .filter((product) => product.type === "recurring")
//       .reduce((groups, product) => {
//         const key = `${product.interval}-${product.interval_count}`;

//         if (!groups[key]) {
//           groups[key] = [];
//         }

//         // ✅ Use the correct quantity from the product
//         groups[key].push({
//           price: product.stripePriceId,
//           quantity: product.quantity || 1,
//         });
//         return groups;
//       }, {} as Record<string, Stripe.SubscriptionCreateParams.Item[]>);

//     // ✅ Step 2: Create separate subscriptions for each billing interval group
//     const createdSubscriptions: {
//       subscriptionId: string;
//       invoiceId: string | null;
//     }[] = [];

//     for (const [interval, subscriptionItems] of Object.entries(
//       groupedProducts
//     )) {
//       console.log(`🔄 Creating subscription for billing interval: ${interval}`);

//       const subscription = await stripe.subscriptions.create({
//         customer: customerId,
//         items: subscriptionItems,
//         collection_method: "send_invoice",
//         days_until_due: 7,
//         expand: ["latest_invoice.payment_intent"],
//         metadata: {
//           deal_id: dealId,
//           billing_interval: interval,
//           created_by: "HubSpot Integration",
//         },
//       });

//       console.log(
//         `📩 Subscription with invoice created for customer ${customerId}: ${subscription.id}`
//       );

//       // ✅ Extract Invoice ID
//       let invoiceId: string | null = null;
//       if (typeof subscription.latest_invoice === "string") {
//         invoiceId = subscription.latest_invoice;
//       } else if (
//         subscription.latest_invoice &&
//         "id" in subscription.latest_invoice
//       ) {
//         invoiceId = subscription.latest_invoice.id;
//       }

//       // ✅ Add Metadata to Invoice and Finalize
//       if (invoiceId) {
//         console.log(`📩 Updating invoice ${invoiceId} with metadata...`);

//         await stripe.invoices.update(invoiceId, {
//           metadata: {
//             deal_id: dealId,
//             subscription_id: subscription.id,
//             created_by: "HubSpot Integration",
//           },
//         });

//         // ✅ Finalize the invoice
//         const finalizedInvoice = await stripe.invoices.finalizeInvoice(
//           invoiceId
//         );
//         console.log(
//           `📨 Invoice finalized and sent immediately: ${finalizedInvoice.id}`
//         );
//       } else {
//         console.warn(
//           `⚠️ No invoice found for subscription: ${subscription.id}`
//         );
//       }

//       // ✅ Collect Subscription and Invoice IDs
//       createdSubscriptions.push({ subscriptionId: subscription.id, invoiceId });
//     }

//     return createdSubscriptions;
//   } catch (error) {
//     console.error(
//       `❌ Error creating subscription with invoice for customer ${customerId}:`,
//       error
//     );
//     return null;
//   }
// };

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
        numberofemployees: company.properties.numberofemployees || "",
        annualrevenue: company.properties.annualrevenue || "",
        timezone: company.properties.timezone || "",
        description: company.properties.description || "",
        linkedincompanyprofile: company.properties.linkedincompanyprofile || "",
        hubspot_owner_id: company.properties.hubspot_owner_id || "",
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
      domain: "metadata.website",
      name: "name",
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
        cust?.metadata?.hubspot_company_id.toString() === companyId.toString()
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
        cust?.metadata?.hubspot_contact_id.toString() === companyId.toString()
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
        cust?.metadata?.hubspot_product_id.toString() === companyId.toString()
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

const checkPaymentMethod = async (
  stripe_acc_id: string,
  stripe_access_token: string,
  invoice_id: string
) => {
  try {
    // Define SQL Query
    const query = `
    SELECT uhd.save_payment_method
    FROM estuate.user_oauth uo
    JOIN estuate.user_stripe_data usd ON uo.user_id = usd.user_id
    JOIN estuate.user_hubspot_data uhd ON uo.user_id = uhd.user_id
    WHERE uo.stripe_acc = ?;
      `;

    // Get a database connection
    const connection = await pool.getConnection();

    try {
      // Execute query
      const [rows]: any[] = await connection.execute(query, [stripe_acc_id]);

      // Extract save_payment_method value
      const save_payment_method =
        rows.length > 0 ? rows[0].save_payment_method : null;
      console.log("Save Payment Method:", save_payment_method);

      if (!save_payment_method) {
        console.log("Payment method save option missing.");
        return;
      }
      if (save_payment_method == "no") {
        console.log("Payment method save option not enabled.");
        return;
      }

      // Initialize Stripe
      const stripe = new Stripe(stripe_access_token, {
        apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
      });

      // Retrieve invoice
      const invoice = await stripe.invoices.retrieve(invoice_id);
      const payment_intent_id = invoice.payment_intent as string;
      console.log("Payment Intent ID:", payment_intent_id);
      if (!payment_intent_id) {
        console.log("Payment Intent ID not found to sav the payment method");
        return;
      }
      // Retrieve the PaymentIntent to get the Payment Method ID
      const paymentIntent = await stripe.paymentIntents.retrieve(
        payment_intent_id
      );
      const payment_method_id = paymentIntent.payment_method as string;
      console.log("Payment Method ID:", payment_method_id);

      if (invoice.customer) {
        await stripe.paymentMethods.attach(payment_method_id, {
          customer: invoice.customer as string,
        });

        console.log("Payment method attached to customer:", invoice.customer);

        // Set the Payment Method as Default for Future Invoices
        await stripe.customers.update(invoice.customer as string, {
          invoice_settings: { default_payment_method: payment_method_id },
        });

        console.log("Payment method set as default for future invoices.");
      } else {
        console.log("Invoice does not have a valid customer ID.");
      }

      console.log("Payment method successfully saved for future use.");
    } finally {
      // Release the database connection
      connection.release();
    }
  } catch (error) {
    console.error("Error fetching save_payment_method:", error);
    throw error;
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
  checkPaymentMethod,
  createUsageBasedProductPerUnit,
  createUsageBasedProductPerPackage,
  createUsageBasedProductPerTeir,
  updateStripeSubscriptionWithUsage,
};
