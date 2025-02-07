import sharp from 'sharp';
import { ActionRun } from '@shopify/shopify-app-remix';

// Define input parameter types
interface GenerateProductPreviewParams {
  customerImage: {
    buffer: Buffer;
    mimetype: string;
  };
  maskImage: {
    buffer: Buffer;
    mimetype: string;
  };
  productTitle: string;
  productDescription: string;
}

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const TARGET_WIDTH = 1080;
const TIMEOUT = 30000; // 30 seconds
const SUPPORTED_FORMATS = ['image/jpeg', 'image/png'];

export const run: ActionRun = async ({ params, connections }) => {
  const { customerImage, maskImage, productTitle, productDescription } = params as GenerateProductPreviewParams;

  try {
    // Validate input files
    validateImage(customerImage);
    validateImage(maskImage);

    if (!productTitle || !productDescription) {
      throw new Error('Product title and description are required');
    }

    // Process images
    const processedCustomerImage = await processImage(customerImage.buffer);
    const processedMaskImage = await processImage(maskImage.buffer);

    // Create OpenAI client
    const openai = new OpenAI();

    // Prepare prompt for realistic integration
    const prompt = generatePrompt(productTitle, productDescription);

    // Set timeout for the OpenAI API call
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), TIMEOUT)
    );

    // Make API call to DALL-E 2
    const imageResponse = await Promise.race([
      openai.images.edit({
        image: processedCustomerImage,
        mask: processedMaskImage,
        prompt: prompt,
        n: 1,
        size: '1024x1024',
      }),
      timeoutPromise,
    ]);

    if (!('data' in imageResponse)) {
      throw new Error('Failed to generate image');
    }

    return {
      success: true,
      editedImage: imageResponse.data[0].url,
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    };
  }
};

// Helper functions
function validateImage(image: { buffer: Buffer; mimetype: string }) {
  if (!image || !image.buffer) {
    throw new Error('Image file is required');
  }

  if (image.buffer.length > MAX_FILE_SIZE) {
    throw new Error('Image file size exceeds 5MB limit');
  }

  if (!SUPPORTED_FORMATS.includes(image.mimetype)) {
    throw new Error('Unsupported image format. Please use JPEG or PNG');
  }
}

async function processImage(buffer: Buffer): Promise<Buffer> {
  const image = sharp(buffer);
  const metadata = await image.metadata();

  if (!metadata.width) {
    throw new Error('Invalid image');
  }

  // Resize if width is larger than target width while maintaining aspect ratio
  if (metadata.width > TARGET_WIDTH) {
    return image
      .resize(TARGET_WIDTH, undefined, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toBuffer();
  }

  return buffer;
}

function generatePrompt(title: string, description: string): string {
  return `Create a highly realistic visualization of ${title} in this space. 
    The product should seamlessly blend with the existing environment while maintaining these specifications: ${description}. 
    Ensure natural lighting, proper perspective, and realistic shadows to match the original image's style.`;
}

// Define params schema
export const params = {
  customerImage: {
    type: 'object',
    required: ['buffer', 'mimetype'],
    properties: {
      buffer: { type: 'object' },
      mimetype: { type: 'string' },
    },
  },
  maskImage: {
    type: 'object',
    required: ['buffer', 'mimetype'],
    properties: {
      buffer: { type: 'object' },
      mimetype: { type: 'string' },
    },
  },
  productTitle: { type: 'string' },
  productDescription: { type: 'string' },
};