import type { GadgetSettings } from "gadget-server";

export const settings: GadgetSettings = {
  type: "gadget/settings/v1",
  frameworkVersion: "v1.3.0",
  plugins: {
    connections: {
      shopify: {
        apiVersion: "2024-10",
        enabledModels: [
          "shopifyArticle",
          "shopifyAsset",
          "shopifyBlog",
          "shopifyComment",
          "shopifyFile",
          "shopifyPage",
          "shopifyProduct",
          "shopifyProductMedia",
          "shopifyProductOption",
          "shopifyProductVariant",
          "shopifyProductVariantMedia",
          "shopifyRedirect",
          "shopifyTheme",
        ],
        type: "partner",
        scopes: [
          "read_products",
          "unauthenticated_read_product_listings",
          "read_script_tags",
          "write_script_tags",
          "read_themes",
          "write_themes",
          "read_content",
          "write_content",
        ],
      },
      openai: true,
    },
  },
};
