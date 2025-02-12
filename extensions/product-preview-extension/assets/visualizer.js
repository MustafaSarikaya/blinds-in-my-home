// Helper services
const ImageService = {
  // Store the original image file
  originalImage: null,

  calculateCanvasDimensions(imageWidth, imageHeight, containerWidth, containerHeight) {
    console.log('Calculating canvas dimensions:', {
      imageWidth,
      imageHeight,
      containerWidth,
      containerHeight
    });

    // If container dimensions are 0, use default values based on typical screen sizes
    if (containerWidth === 0 || containerHeight === 0) {
      containerWidth = Math.min(window.innerWidth * 0.25, 900); // 25% of window width, max 1200px
      containerHeight = Math.min(window.innerHeight * 0.1, 300); // 70% of window height, max 800px
      console.log('Using default container dimensions:', { containerWidth, containerHeight });
    }

    const containerRatio = containerWidth / containerHeight;
    const imageRatio = imageWidth / imageHeight;
    
    let width, height, scale;
    
    if (imageRatio > containerRatio) {
      // Image is wider than container ratio
      width = containerWidth;
      height = containerWidth / imageRatio;
      scale = containerWidth / imageWidth;
    } else {
      // Image is taller than container ratio
      height = containerHeight;
      width = containerHeight * imageRatio;
      scale = containerHeight / imageHeight;
    }
    
    // Ensure minimum dimensions
    width = Math.max(width, 300);
    height = Math.max(height, 200);
    
    console.log('Calculated dimensions:', { width, height, scale });
    return { width, height, scale };
  },

  async generateMask(fabricCanvas) {
    console.log('Generating mask from canvas:', {
      canvasWidth: fabricCanvas.width,
      canvasHeight: fabricCanvas.height
    });

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = fabricCanvas.width;
    maskCanvas.height = fabricCanvas.height;
    const maskCtx = maskCanvas.getContext('2d');

    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    const selections = fabricCanvas.getObjects().filter(obj => obj instanceof fabric.Rect);
    console.log('Found selections:', selections.length);

    maskCtx.fillStyle = 'white';
    selections.forEach((obj, index) => {
      console.log(`Drawing selection ${index + 1}:`, {
        left: obj.left,
        top: obj.top,
        width: obj.width * obj.scaleX,
        height: obj.height * obj.scaleY
      });
      maskCtx.fillRect(
        obj.left,
        obj.top,
        obj.width * obj.scaleX,
        obj.height * obj.scaleY
      );
    });

    return new Promise((resolve) => {
      maskCanvas.toBlob((blob) => {
        console.log('Mask generated successfully:', { blobSize: blob.size });
        resolve(blob);
      }, 'image/png');
    });
  }
};

const ApiService = {
  async generatePreview(imageBlob, maskBlob, productId, variantId) {
    console.log('Starting preview generation:', {
      imageBlobSize: imageBlob.size,
      maskBlobSize: maskBlob.size,
      productId,
      variantId
        });
    // Convert blobs to base64
    console.log('🔄 Converting images to base64...', {
      customerImageSize: imageBlob.size,
      maskImageSize: maskBlob.size
    });

    const [imageBase64, maskBase64] = await Promise.all([
      this.blobToBase64(imageBlob),
      this.blobToBase64(maskBlob)
    ]);

    console.log('✅ Images converted successfully', {
      customerImageBase64Length: imageBase64.length,
      maskImageBase64Length: maskBase64.length
    });

    // GraphQL mutation for generating product preview
    const mutation = `
      mutation GenerateProductPreview(
        $customerImage: GenerateProductPreviewCustomerImageInput
        $maskImage: GenerateProductPreviewMaskImageInput
        $productId: String
        $variantId: String
      ) {
        generateProductPreview(
          customerImage: $customerImage
          maskImage: $maskImage
          productId: $productId
          variantId: $variantId
        ) {
          success
          errors {
            message
          }
          result
        }
      }
    `;

    const variables = {
      customerImage: {
        buffer: imageBase64,
        mimetype: imageBlob.type
      },
      maskImage: {
        buffer: maskBase64,
        mimetype: maskBlob.type
      },
      productId: productId,
      variantId: variantId
    };

    console.log('graphql variables:', {variables: variables})

    try {

      const response = await fetch('https://blinds-in-my-home--development.gadget.app/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: mutation,
          variables: variables
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Preview generation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        throw new Error(`Failed to generate preview: ${response.statusText}`);
      }

      console.log('✅ Received successful response from API');
      const result = await response.json();

      if (result.errors) {
        console.error('❌ GraphQL errors received:', result.errors);
        throw new Error(result.errors[0].message);
      }

      console.log('🎉 Preview generated successfully', {
        success: result.data?.generateProductPreview?.success,
        hasResult: !!result.data?.generateProductPreview?.result
      });

      return {
        success: true,
        imageUrl: result.data.generateProductPreview.result
      };

    } catch (error) {
      console.error('❌ Error in generatePreview:', {
        error: error.message,
        stack: error.stack,
      });
      return {
        success: false,
        error: error.message || 'Failed to generate preview'
      };
    }
  },

   // Helper method to convert blob to base64
   blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = () => reject(new Error('Failed to convert image to base64'));
      reader.readAsDataURL(blob);
    });
  },

  async addToCart(variantId, quantity = 1) {
    console.log('Starting add to cart:', {
      variantId,
      quantity
    });

    const formData = {
      items: [{ id: variantId, quantity }]
    };

    // Note: Keep the cart endpoint as is since it's a Shopify endpoint
    console.log('Sending add to cart request:', formData);
    const response = await fetch('/cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Add to cart failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error('Failed to add item to cart');
    }

    const result = await response.json();
    console.log('Item added to cart successfully:', result);
    return result;
  }
};

class CurtainVisualizer {
  constructor() {
    console.log('Initializing CurtainVisualizer');
    this.initializeElements();
    this.setupEventListeners();
    this.canvas = null;
    this.fabricCanvas = null;
  }

  initializeElements() {
    console.log('Finding and initializing DOM elements');
    // Buttons
    this.openButton = document.getElementById('openVisualizerBtn');
    this.closeButton = document.getElementById('closeVisualizerBtn');
    this.uploadButton = document.getElementById('uploadButton');
    this.imageInput = document.getElementById('imageInput');
    this.undoButton = document.getElementById('undoButton');
    this.clearButton = document.getElementById('clearButton');
    this.confirmButton = document.getElementById('confirmButton');
    this.tryAgainButton = document.getElementById('tryAgainButton');
    this.addToCartButton = document.getElementById('addToCartButton');

    // Containers
    this.modal = document.getElementById('visualizerModal');
    this.step1 = document.getElementById('step1');
    this.step2 = document.getElementById('step2');
    this.step3 = document.getElementById('step3');
    this.loadingState = document.getElementById('loadingState');
    this.canvasContainer = document.getElementById('selectionCanvas').parentElement;
    this.resultImage = document.getElementById('resultImage');
    this.uploadArea = document.getElementById('uploadArea');

    const visualizer = document.querySelector('.curtain-visualizer');
    this.productId = visualizer.dataset.productId;
    this.variantId = visualizer.dataset.variantId;
    
    console.log('Elements initialized:', {
      productId: this.productId,
      variantId: this.variantId
    });
  }

  setupEventListeners() {
    console.log('Setting up event listeners');
    // Modal controls
    this.openButton.addEventListener('click', () => this.openModal());
    this.closeButton.addEventListener('click', () => this.closeModal());

    // Upload handlers
    this.uploadButton.addEventListener('click', () => this.imageInput.click());
    this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
    this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
    this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));

    // Selection controls
    this.undoButton.addEventListener('click', () => this.undoLastSelection());
    this.clearButton.addEventListener('click', () => this.clearSelection());
    this.confirmButton.addEventListener('click', () => this.generatePreview());

    // Result controls
    this.tryAgainButton.addEventListener('click', () => this.resetToStep1());
    this.addToCartButton.addEventListener('click', () => this.addToCart());
  }

  initializeCanvas(width, height) {
    console.log('Initializing canvas with dimensions:', { width, height });

    if (this.fabricCanvas) {
      console.log('Disposing existing canvas');
      this.fabricCanvas.dispose();
    }

    const canvas = document.getElementById('selectionCanvas');
    canvas.width = width;
    canvas.height = height;

    console.log('Creating new Fabric.js canvas');
    this.fabricCanvas = new fabric.Canvas('selectionCanvas', {
      width: width,
      height: height,
      selection: false,
      preserveObjectStacking: true
    });

    this._setupDrawingMode();
    console.log('Canvas initialization complete');
  }

  _setupDrawingMode() {
    console.log('Setting up drawing mode');
    let isDrawing = false;
    let rect;
    let startX, startY;

    this.fabricCanvas.on('mouse:down', (o) => {
      console.log('Mouse down event:', o.pointer);
      isDrawing = true;
      const pointer = this.fabricCanvas.getPointer(o.e);
      startX = pointer.x;
      startY = pointer.y;

      rect = new fabric.Rect({
        left: startX,
        top: startY,
        width: 0,
        height: 0,
        stroke: '#008060',
        strokeWidth: 2,
        fill: 'rgba(0, 128, 96, 0.2)',
        selectable: true
      });

      this.fabricCanvas.add(rect);
      console.log('Started drawing rectangle at:', { x: startX, y: startY });
    });

    this.fabricCanvas.on('mouse:move', (o) => {
      if (!isDrawing) return;

      const pointer = this.fabricCanvas.getPointer(o.e);
      console.log('Mouse move while drawing:', pointer);
      
      if (startX > pointer.x) {
        rect.set({ left: pointer.x });
      }
      if (startY > pointer.y) {
        rect.set({ top: pointer.y });
      }

      rect.set({
        width: Math.abs(startX - pointer.x),
        height: Math.abs(startY - pointer.y)
      });

      this.fabricCanvas.renderAll();
    });

    this.fabricCanvas.on('mouse:up', () => {
      isDrawing = false;
      if (rect.width === 0 || rect.height === 0) {
        console.log('Removing zero-size rectangle');
        this.fabricCanvas.remove(rect);
      } else {
        console.log('Finished drawing rectangle:', {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height
        });
      }
      this.fabricCanvas.setActiveObject(rect);
      this.fabricCanvas.renderAll();
    });
  }

  openModal() {
    console.log('Opening modal');
    this.modal.style.display = 'block';
  }

  closeModal() {
    console.log('Closing modal');
    this.modal.style.display = 'none';
    this.resetToStep1();
  }

  async handleImageUpload(event) {
    console.log('Handling image upload:', event);
    const file = event.target.files[0];
    if (file) {
      await this.loadImage(file);
    }
  }

  handleDragOver(event) {
    console.log('Handling drag over:', event);
    event.preventDefault();
    event.stopPropagation();
    this.uploadArea.style.borderColor = '#008060';
  }

  handleDrop(event) {
    console.log('Handling drop:', event);
    event.preventDefault();
    event.stopPropagation();
    this.uploadArea.style.borderColor = '#ccc';
    
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      this.loadImage(file);
    }
  }

  async loadImage(file) {
    console.log('Starting image load process:', { 
      fileName: file.name, 
      fileType: file.type, 
      fileSize: file.size 
    });

    // Check file size (10MB = 10 * 1024 * 1024 bytes)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      throw new Error(`Image size (${sizeMB}MB) exceeds maximum allowed size of 10MB. Please upload a smaller image.`);
    }

    let objectUrl = null;
    try {
      ImageService.originalImage = file;
      objectUrl = URL.createObjectURL(file);
      console.log('Created object URL for image:', objectUrl);

      const img = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          console.log('Image loaded with dimensions:', {
            width: img.width,
            height: img.height
          });
          resolve(img);
        };
        img.onerror = (error) => {
          console.error('Error loading image:', error);
          reject(error);
        };
        img.src = objectUrl;
      });

      // Get container and ensure it's rendered
      const container = document.querySelector('.canvas-container');
      
      // Force a reflow to ensure dimensions are calculated
      container.offsetHeight;
      
      let containerWidth = container.clientWidth;
      let containerHeight = container.clientHeight;
      
      // If dimensions are still 0, get them from the computed style
      if (containerWidth === 0 || containerHeight === 0) {
        const style = window.getComputedStyle(container);
        containerWidth = parseInt(style.width) || containerWidth;
        containerHeight = parseInt(style.height) || containerHeight;
      }
      
      console.log('Container dimensions:', { containerWidth, containerHeight });

      const { width, height, scale } = ImageService.calculateCanvasDimensions(
        img.width,
        img.height,
        containerWidth,
        containerHeight
      );

      this.initializeCanvas(width, height);

      console.log('Loading image into Fabric.js canvas');
      return new Promise((resolve, reject) => {
        fabric.Image.fromURL(objectUrl, (fabricImg) => {
          console.log('Image loaded into Fabric.js');
          fabricImg.scaleToWidth(width);
          fabricImg.scaleToHeight(height);
          
          this.fabricCanvas.setBackgroundImage(fabricImg, () => {
            console.log('Background image set and rendered');
            this.fabricCanvas.renderAll();
            
            this.step1.classList.add('hidden');
            this.step2.classList.remove('hidden');
            
            // Now that we're done with the image URL, we can revoke it
            if (objectUrl) {
              console.log('Cleaning up object URL');
              URL.revokeObjectURL(objectUrl);
              objectUrl = null;
            }
            resolve();
          }, {
            originX: 'center',
            originY: 'center',
            left: width / 2,
            top: height / 2,
            crossOrigin: 'anonymous'
          });
        }, { 
          crossOrigin: 'anonymous'
        });
      });

    } catch (error) {
      console.error('Error in loadImage:', error);
      alert('Failed to load image. Please try again.');
      if (objectUrl) {
        console.log('Cleaning up object URL due to error');
        URL.revokeObjectURL(objectUrl);
      }
      throw error;
    }
  }

  undoLastSelection() {
    console.log('Undoing last selection');
    const activeObject = this.fabricCanvas.getActiveObject();
    if (activeObject) {
      this.fabricCanvas.remove(activeObject);
      this.fabricCanvas.renderAll();
    }
  }

  clearSelection() {
    console.log('Clearing selection');
    this.fabricCanvas.getObjects().slice().forEach(obj => {
      if (obj !== this.fabricCanvas.backgroundImage) {
        this.fabricCanvas.remove(obj);
      }
    });
    this.fabricCanvas.renderAll();
  }

  async generatePreview() {
    console.log('Starting preview generation process');
    
    try {
      // Show loading state
      this.confirmButton.disabled = true;
      this.confirmButton.textContent = 'Generating...';
      
      // Get the product ID and variant ID from the page
      const productId = this.productId;
      const variantId = this.variantId;
      
      if (!productId || !variantId) {
        throw new Error('Product or variant ID not found');
      }

      // Convert canvas to blob
      const imageBlob = await new Promise((resolve) => {
        const backgroundImage = this.fabricCanvas.backgroundImage;
        if (!backgroundImage) {
          throw new Error('No image uploaded');
        }
        const imageDataUrl = backgroundImage.canvas.toDataURL('image/png');
        const binaryData = atob(imageDataUrl.split(',')[1]);
        const array = [];
        for (let i = 0; i < binaryData.length; i++) {
          array.push(binaryData.charCodeAt(i));
        }
        const imageBlob = new Blob([new Uint8Array(array)], { type: 'image/png' });
        resolve(imageBlob);
      });

      // Generate mask from selections
      const maskBlob = await ImageService.generateMask(this.fabricCanvas);

      // Call API to generate preview
      const result = await ApiService.generatePreview(imageBlob, maskBlob, productId, variantId);
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to generate preview');
      }

      // Display the result
      this.resultImage.src = result.imageUrl;
      this.step2.classList.add('hidden');
      this.step3.classList.remove('hidden');
      
    } catch (error) {
      console.error('Preview generation failed:', error);
      alert(error.message || 'Failed to generate preview. Please try again.');
    } finally {
      // Reset button state
      this.confirmButton.disabled = false;
      this.confirmButton.textContent = 'Generate Preview';
    }
  }

  resetToStep1() {
    console.log('Resetting to step 1');
    this.step3.classList.add('hidden');
    this.step2.classList.add('hidden');
    this.loadingState.classList.add('hidden');
    this.step1.classList.remove('hidden');
    
    if (this.fabricCanvas) {
      console.log('Disposing canvas');
      this.fabricCanvas.dispose();
      this.fabricCanvas = null;
    }
    
    this.imageInput.value = '';
  }

  async addToCart() {
    console.log('Adding to cart');
    try {
      await ApiService.addToCart(this.variantId);
      this.closeModal();
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    }
  }
}



// Initialize when Fabric.js is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Document loaded, initializing Fabric.js');
  
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js';
  
  script.onload = () => {
    console.log('Fabric.js loaded successfully');
    try {
      console.log('Creating CurtainVisualizer instance');
      new CurtainVisualizer();
      console.log('CurtainVisualizer initialized successfully');
    } catch (error) {
      console.error('Error initializing CurtainVisualizer:', error);
    }
  };
  
  script.onerror = (error) => {
    console.error('Failed to load Fabric.js:', error);
  };
  
  console.log('Adding Fabric.js script to document');
  document.head.appendChild(script);
});
