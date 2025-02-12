// Type for base64 string validation
type Base64String = string;

// Define input parameter types
interface GenerateProductPreviewParams {
  customerImage: {
    buffer: Base64String;
    mimetype: string;
  };
  maskImage: {
    buffer: Base64String;
    mimetype: string;
  };
  productId: string;
  variantId: string;
}

// Constants
const TIMEOUT = 30000; // 30 seconds
const SUPPORTED_FORMATS = ['image/jpeg', 'image/png'];

export const run: ActionRun = async ({ params, api, connections }) => {
  const { customerImage, maskImage, productId, variantId } = params as GenerateProductPreviewParams;

  try {
    // Validate base64 strings
    if (!isBase64(customerImage.buffer)) {
      throw new Error('Customer image is not a valid base64 string');
    }
    if (!isBase64(maskImage.buffer)) {
      throw new Error('Mask image is not a valid base64 string');
    }

    // Validate required fields
    if (!productId || !variantId) {
      throw new Error('Product ID and variant ID are required');
    }

    // Get product details from Shopify
    const product = await api.shopifyProduct.findOne(productId, {
      select: { body: true, title: true },
    });

    // Convert base64 to Buffers for DALL-E
    const customerImageBuffer = Buffer.from(customerImage.buffer, 'base64');
    const maskImageBuffer = Buffer.from(maskImage.buffer, 'base64');

    // Generate prompt for DALL-E
    const prompt = generatePrompt(product.title, product.body);

    // Set timeout for the OpenAI API call
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('OpenAI API timeout')), TIMEOUT)
    );

    // Make API call to DALL-E 2
    const imageResponse = await Promise.race([
      connections.openai.images.edit({
        model: "dall-e-2",
        image: customerImageBuffer, // DALL-E expects a PNG buffer
        mask: maskImageBuffer,    // DALL-E expects a PNG buffer
        prompt: prompt,
        n: 1,
        size: "1024x1024"
      }),
      timeoutPromise
    ]);

    console.log('Successfully generated image');

    return {
      success: true,
      imageUrl: imageResponse.data[0].url
    };

  } catch (error) {
    console.error('Error generating product preview:', error);
    return {
      success: false,
      error: {
        message: error.message || 'Failed to generate preview'
      }
    };
  }
};

// Helper functions
// Validate if string is base64
function isBase64(str: string): boolean {
    try {
      return btoa(atob(str)) === str;
    } catch (err) {
      return false;
    }
  }

function generatePrompt(productTitle: string | null, productDescription: string | null): string {
  return `Create a highly realistic visualization of ${productTitle} in this space. 
    The product should seamlessly blend with the existing environment while maintaining these specifications: ${productDescription ? productDescription : productTitle}. 
    Ensure natural lighting, proper perspective, and realistic shadows to match the original image's style.`;
}

export const params = {
  customerImage: {
    type: 'object',
    required: ['buffer', 'mimetype'],
    properties: {
      buffer: { type: 'string', pattern: '^[A-Za-z0-9+/=]+$' }, // base64 pattern
      mimetype: { type: 'string' },
    },
  },
  maskImage: {
    type: 'object',
    required: ['buffer', 'mimetype'],
    properties: {
      buffer: { type: 'string', pattern: '^[A-Za-z0-9+/=]+$' }, // base64 pattern
      mimetype: { type: 'string' },
    },
  },
  productId: { type: 'string' },
  variantId: { type: 'string' }
};
