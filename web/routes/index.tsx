import { AutoTable } from "@gadgetinc/react/auto/polaris";
import {
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Layout,
  Link,
  Page,
  Text,
} from "@shopify/polaris";
import { api } from "../api";
import { CurtainVisualizer, VisualizerData } from "../components/features/curtain-visualizer/CurtainVisualizer";
import { useState } from "react";

export default function () {
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);

  const handleVisualizerOpen = () => setIsVisualizerOpen(true);
  const handleVisualizerClose = () => setIsVisualizerOpen(false);

  const handleVisualizerSubmit = async (data: VisualizerData) => {
    console.log('Processing visualization with data:', data);
    
    // TODO: Implement image processing logic here
    // 1. Create a FormData object to send the image
    const formData = new FormData();
    formData.append('image', data.image as File);
    formData.append('curtainSize', data.curtainSize);
    formData.append('frameStyle', data.frameStyle);

    try {
      // TODO: Replace with your actual API endpoint
      const response = await fetch('/api/visualize-curtain', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process image');
      }

      // TODO: Handle the processed image response
      const result = await response.json();
      console.log('Processed image:', result);
      
    } catch (error) {
      console.error('Error processing image:', error);
      // TODO: Handle error appropriately
    }

    handleVisualizerClose();
  };

  return (
    <Page title="App">
      <Layout>
        <Layout.Section>
          <Banner tone="success">
            <Text variant="bodyMd" as="p">
              Successfully connected your Gadget app to Shopify
            </Text>
          </Banner>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <img
              className="gadgetLogo"
              src="https://assets.gadget.dev/assets/icon.svg"
            />
            <BlockStack gap="200">
              <Text variant="headingMd" as="h1" alignment="center">
                Edit this page:{" "}
                <Link
                  url={`/edit/${window.gadgetConfig.env.GADGET_ENV}/files/web/routes/index.tsx`}
                  target="_blank"
                  removeUnderline
                >
                  web/routes/index.tsx
                </Link>
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card padding="0">
            {/* use Autocomponents to build UI quickly: https://docs.gadget.dev/guides/frontend/autocomponents  */}
            <AutoTable
              //@ts-ignore
              model={api.shopifyShop}
              columns={["name", "countryName", "currency", "customerEmail"]}
            />
            <Box padding="400">
              <Text variant="headingMd" as="h6">
                Shop records fetched from:{" "}
                <Link
                  url={`/edit/${window.gadgetConfig.env.GADGET_ENV}/model/DataModel-Shopify-Shop/data`}
                  target="_blank"
                  removeUnderline
                >
                  api/models/shopifyShop/data
                </Link>
              </Text>
            </Box>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Visualize Curtains in Your Space
              </Text>
              <Text variant="bodyMd" as="p">
                See how our curtains will look in your space before you buy. Upload a photo or use your camera to get started.
              </Text>
              <Button primary onClick={handleVisualizerOpen}>
                Try in Your Space
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>

        <CurtainVisualizer
          open={isVisualizerOpen}
          onClose={handleVisualizerClose}
          onSubmit={handleVisualizerSubmit}
        />
      </Layout>
    </Page>
  );
}
