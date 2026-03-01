import {
  CreateInventoryLevelInput,
  ExecArgs,
} from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresStep,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";
import { ApiKey } from "../../.medusa/types/query-entry-points";
import * as fs from "fs";
import * as path from "path";

interface ProductData {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  price: number;
  variants: { size: string; price: number }[];
  image: string;
  image_url_original: string;
}

const updateStoreCurrencies = createWorkflow(
  "update-store-currencies-quadros",
  (input: {
    supported_currencies: { currency_code: string; is_default?: boolean }[];
    store_id: string;
  }) => {
    const normalizedInput = transform({ input }, (data) => {
      return {
        selector: { id: data.input.store_id },
        update: {
          supported_currencies: data.input.supported_currencies.map(
            (currency) => ({
              currency_code: currency.currency_code,
              is_default: currency.is_default ?? false,
            })
          ),
        },
      };
    });

    const stores = updateStoresStep(normalizedInput);
    return new WorkflowResponse(stores);
  }
);

export default async function seedQuadrosData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const storeModuleService = container.resolve(Modules.STORE);

  // Load products from JSON
  const productsPath = path.resolve(__dirname, "../../../products.json");
  const productsData: ProductData[] = JSON.parse(
    fs.readFileSync(productsPath, "utf-8")
  );
  logger.info(`Loaded ${productsData.length} products from products.json`);

  // --- STORE SETUP ---
  logger.info("Setting up store for Brazil...");
  const [store] = await storeModuleService.listStores();

  // Update store name
  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        name: "Quadros Store",
      },
    },
  });

  // Sales Channel
  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });

  if (!defaultSalesChannel.length) {
    const { result: salesChannelResult } = await createSalesChannelsWorkflow(
      container
    ).run({
      input: {
        salesChannelsData: [{ name: "Default Sales Channel" }],
      },
    });
    defaultSalesChannel = salesChannelResult;
  }

  // Set BRL as default currency
  await updateStoreCurrencies(container).run({
    input: {
      store_id: store.id,
      supported_currencies: [
        { currency_code: "brl", is_default: true },
      ],
    },
  });

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        default_sales_channel_id: defaultSalesChannel[0].id,
      },
    },
  });

  // --- REGION: BRAZIL ---
  logger.info("Seeding Brazil region...");
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Brasil",
          currency_code: "brl",
          countries: ["br"],
          payment_providers: ["pp_system_default"],
        },
      ],
    },
  });
  const region = regionResult[0];
  logger.info("Finished seeding Brazil region.");

  // --- TAX REGION ---
  logger.info("Seeding tax region...");
  await createTaxRegionsWorkflow(container).run({
    input: [
      {
        country_code: "br",
        provider_id: "tp_system",
      },
    ],
  });

  // --- STOCK LOCATION ---
  logger.info("Seeding stock location...");
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "Warehouse Brasil",
          address: {
            city: "Sao Paulo",
            country_code: "BR",
            address_1: "Rua Augusta, 100",
          },
        },
      ],
    },
  });
  const stockLocation = stockLocationResult[0];

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        default_location_id: stockLocation.id,
      },
    },
  });

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
  });

  // --- FULFILLMENT / SHIPPING ---
  logger.info("Seeding fulfillment data...");
  const shippingProfiles =
    await fulfillmentModuleService.listShippingProfiles({ type: "default" });
  let shippingProfile = shippingProfiles.length ? shippingProfiles[0] : null;

  if (!shippingProfile) {
    const { result: shippingProfileResult } =
      await createShippingProfilesWorkflow(container).run({
        input: {
          data: [{ name: "Default Shipping Profile", type: "default" }],
        },
      });
    shippingProfile = shippingProfileResult[0];
  }

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "Brazil Delivery",
    type: "shipping",
    service_zones: [
      {
        name: "Brasil",
        geo_zones: [{ country_code: "br", type: "country" }],
      },
    ],
  });

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
  });

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Entrega Padrao",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Padrao",
          description: "Entrega em 5-10 dias uteis.",
          code: "standard",
        },
        prices: [
          { currency_code: "brl", amount: 15 },
          { region_id: region.id, amount: 15 },
        ],
        rules: [
          { attribute: "enabled_in_store", value: "true", operator: "eq" },
          { attribute: "is_return", value: "false", operator: "eq" },
        ],
      },
      {
        name: "Entrega Expressa",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Expressa",
          description: "Entrega em 1-3 dias uteis.",
          code: "express",
        },
        prices: [
          { currency_code: "brl", amount: 29.9 },
          { region_id: region.id, amount: 29.9 },
        ],
        rules: [
          { attribute: "enabled_in_store", value: "true", operator: "eq" },
          { attribute: "is_return", value: "false", operator: "eq" },
        ],
      },
    ],
  });
  logger.info("Finished seeding fulfillment data.");

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [defaultSalesChannel[0].id],
    },
  });

  // --- PUBLISHABLE API KEY ---
  logger.info("Seeding publishable API key...");
  let publishableApiKey: ApiKey | null = null;
  const { data } = await query.graph({
    entity: "api_key",
    fields: ["id"],
    filters: { type: "publishable" },
  });

  publishableApiKey = data?.[0];

  if (!publishableApiKey) {
    const {
      result: [publishableApiKeyResult],
    } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          { title: "Quadros Store Key", type: "publishable", created_by: "" },
        ],
      },
    });
    publishableApiKey = publishableApiKeyResult as ApiKey;
  }

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel[0].id],
    },
  });
  logger.info("Finished seeding publishable API key.");

  // --- PRODUCT CATEGORIES ---
  logger.info("Seeding product categories...");
  const uniqueCategories = [
    ...new Set(productsData.map((p) => p.category)),
  ];

  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: uniqueCategories.map((cat) => ({
        name: cat,
        is_active: true,
      })),
    },
  });
  logger.info(`Created ${categoryResult.length} categories.`);

  // --- PRODUCTS ---
  logger.info("Seeding products...");

  const products = productsData.map((p) => ({
    title: p.name,
    category_ids: [
      categoryResult.find((cat) => cat.name === p.category)!.id,
    ],
    description: p.description,
    handle: p.slug,
    weight: 500,
    status: ProductStatus.PUBLISHED,
    shipping_profile_id: shippingProfile.id,
    images: p.image_url_original
      ? [{ url: p.image_url_original }]
      : [],
    options: [
      {
        title: "Tamanho",
        values: p.variants.map((v) => v.size),
      },
    ],
    variants: p.variants.map((v, i) => ({
      title: v.size,
      sku: `${p.slug.toUpperCase().replace(/-/g, "_")}_${v.size.replace(/[^a-zA-Z0-9]/g, "")}`,
      options: { Tamanho: v.size },
      prices: [{ amount: v.price, currency_code: "brl" }],
    })),
    sales_channels: [{ id: defaultSalesChannel[0].id }],
  }));

  // Create products in batches of 10 to avoid overwhelming the DB
  const batchSize = 10;
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    await createProductsWorkflow(container).run({
      input: { products: batch },
    });
    logger.info(
      `Created products ${i + 1}-${Math.min(i + batchSize, products.length)} of ${products.length}`
    );
  }
  logger.info("Finished seeding product data.");

  // --- INVENTORY LEVELS ---
  logger.info("Seeding inventory levels...");
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  });

  const inventoryLevels: CreateInventoryLevelInput[] = inventoryItems.map(
    (item) => ({
      location_id: stockLocation.id,
      stocked_quantity: 1000000,
      inventory_item_id: item.id,
    })
  );

  await createInventoryLevelsWorkflow(container).run({
    input: { inventory_levels: inventoryLevels },
  });
  logger.info("Finished seeding inventory levels.");

  logger.info("=== SEED COMPLETE ===");
  logger.info(`Store: Quadros Store`);
  logger.info(`Region: Brasil (BRL)`);
  logger.info(`Products: ${productsData.length}`);
  logger.info(`Categories: ${uniqueCategories.join(", ")}`);
}
