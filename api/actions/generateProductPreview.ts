import { createCanvas, loadImage } from 'canvas';

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
  productId: string;
  productTitle: string;
  productDescription: string;
}

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const TARGET_WIDTH = 1080;
const TIMEOUT = 30000; // 30 seconds
const SUPPORTED_FORMATS = ['image/jpeg', 'image/png'];f

export const run: ActionRun = async ({ params, connections }) => {
  const { customerImage, maskImage, productId, productTitle, productDescription } = params as GenerateProductPreviewParams;

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

    // Prepare prompt for realistic integration
    const prompt = generatePrompt(productTitle, productDescription);

    // Set timeout for the OpenAI API call
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), TIMEOUT)
    );

    // Make API call to DALL-E 2
    const imageResponse = await Promise.race([
      connections.openai.images.edit({
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

async function processImage(imageBuffer: Buffer): Promise<Buffer> {
  try {
    // Create a data URL from the buffer
    const dataUrl = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    
    // Load the image
    const image = await loadImage(dataUrl);
    
    // Create a canvas with the image dimensions
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    
    // Draw the image onto the canvas
    ctx.drawImage(image, 0, 0);
    
    // Resize if width is larger than target width while maintaining aspect ratio
    if (image.width > TARGET_WIDTH) {
      const newWidth = TARGET_WIDTH;
      const newHeight = Math.floor(image.height * (newWidth / image.width));
      const newCanvas = createCanvas(newWidth, newHeight);
      const newCtx = newCanvas.getContext('2d');
      newCtx.drawImage(canvas, 0, 0, newWidth, newHeight);
      return newCanvas.toBuffer('image/png');
    }

    return canvas.toBuffer('image/png');
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
}

function generatePrompt(productTitle: string, productDescription: string): string {
  return `Create a highly realistic visualization of ${productTitle} in this space. 
    The product should seamlessly blend with the existing environment while maintaining these specifications: ${productDescription}. 
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
  productId: { type: 'string' },
  productTitle: { type: 'string' },
  productDescription: { type: 'string' },
};