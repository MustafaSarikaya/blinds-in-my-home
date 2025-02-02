import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "shopifyTheme" model, go to https://blinds-in-my-home.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "DataModel-Shopify-Theme",
  fields: {},
  shopify: {
    fields: [
      "assets",
      "name",
      "previewable",
      "processing",
      "role",
      "shop",
      "shopifyCreatedAt",
      "shopifyUpdatedAt",
      "themeStoreId",
    ],
  },
};
