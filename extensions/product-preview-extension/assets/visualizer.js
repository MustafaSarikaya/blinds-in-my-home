
// Define a class that handles all the curtain visualization functionality
// A class is like a blueprint for creating objects with related properties and functions
class CurtainVisualizer {
  // The constructor is called when we create a new instance of this class
  // It sets up all the initial properties and calls necessary setup functions
  constructor() {
    // Call helper functions to set up the visualizer
    this.initializeElements();    // Find and store references to HTML elements
    this.setupEventListeners();   // Set up all the button clicks and user interactions
    
    // Initialize canvas-related properties as null (empty)
    this.canvas = null;           // Will store the HTML canvas element
    this.fabricCanvas = null;     // Will store the Fabric.js canvas object
  }

  // Find all the HTML elements we need and store them for later use
  // This makes it easier to reference these elements throughout our code
  initializeElements() {
    // Find and store all button elements
    this.openButton = document.getElementById('openVisualizerBtn');      // Button to open the modal
    this.closeButton = document.getElementById('closeVisualizerBtn');    // Button to close the modal
    this.uploadButton = document.getElementById('uploadButton');         // Button to trigger file upload
    this.imageInput = document.getElementById('imageInput');            // Hidden file input element
    this.undoButton = document.getElementById('undoButton');            // Button to undo last selection
    this.clearButton = document.getElementById('clearButton');          // Button to clear all selections
    this.confirmButton = document.getElementById('confirmButton');      // Button to confirm and generate preview
    this.tryAgainButton = document.getElementById('tryAgainButton');    // Button to restart the process
    this.addToCartButton = document.getElementById('addToCartButton');  // Button to add product to cart

    // Find and store all container and display elements
    this.modal = document.getElementById('visualizerModal');            // The main modal window
    this.step1 = document.getElementById('step1');                      // Upload step container
    this.step2 = document.getElementById('step2');                      // Selection step container
    this.step3 = document.getElementById('step3');                      // Result step container
    this.loadingState = document.getElementById('loadingState');        // Loading spinner container
    this.canvasContainer = document.getElementById('selectionCanvas').parentElement;  // Container for the canvas
    this.resultImage = document.getElementById('resultImage');          // Image element for showing the result
    this.uploadArea = document.getElementById('uploadArea');            // Drop zone for file uploads

    // Get product information from data attributes in the HTML
    // These are set by Shopify and we need them to identify which product we're working with
    this.productId = document.querySelector('.curtain-visualizer').dataset.productId;
    this.variantId = document.querySelector('.curtain-visualizer').dataset.variantId;
  }

  // Set up all the event listeners (what happens when users click buttons or interact with elements)
  setupEventListeners() {
    // Modal control events
    // When user clicks the open button, show the modal
    this.openButton.addEventListener('click', () => this.openModal());
    // When user clicks the close button, hide the modal
    this.closeButton.addEventListener('click', () => this.closeModal());

    // File upload related events
    // When upload button is clicked, trigger the hidden file input
    this.uploadButton.addEventListener('click', () => this.imageInput.click());
    // When a file is selected through the file input, handle the upload
    this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
    // Handle drag and drop events for file upload
    this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
    this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));

    // Selection control events
    // Set up buttons for managing the window area selections
    this.undoButton.addEventListener('click', () => this.undoLastSelection());
    this.clearButton.addEventListener('click', () => this.clearSelection());
    this.confirmButton.addEventListener('click', () => this.generatePreview());
    
    // Result control events
    // Buttons for handling the final step after preview is generated
    this.tryAgainButton.addEventListener('click', () => this.resetToStep1());
    this.addToCartButton.addEventListener('click', () => this.addToCart());
  }

  // Initialize the Fabric.js canvas for drawing window selections
  // Fabric.js is a powerful library that makes it easier to work with HTML canvas
  initializeFabricCanvas(width, height) {
    // Remove any existing canvas if there is one
    if (this.canvas) {
      this.canvas.remove();
    }

    // Create a new canvas element and add it to our container
    this.canvas = document.createElement('canvas');
    this.canvasContainer.appendChild(this.canvas);

    // Create a new Fabric.js canvas wrapper around our HTML canvas
    // This gives us access to all the powerful Fabric.js features
    this.fabricCanvas = new fabric.Canvas(this.canvas, {
      width: width,
      height: height,
      selection: false  // Disable group selection - we only want to select one rectangle at a time
    });

    // Set up variables for drawing rectangles
    let isDrawing = false;    // Tracks if we're currently drawing
    let rect;                 // Stores the current rectangle being drawn
    let startX, startY;       // Store the starting coordinates when drawing

    // When the user clicks down on the canvas
    this.fabricCanvas.on('mouse:down', (o) => {
      isDrawing = true;
      // Get the mouse position relative to the canvas
      const pointer = this.fabricCanvas.getPointer(o.e);
      startX = pointer.x;
      startY = pointer.y;

      // Create a new rectangle at the click position
      rect = new fabric.Rect({
        left: startX,
        top: startY,
        width: 0,
        height: 0,
        stroke: '#008060',        // Green border color
        strokeWidth: 2,           // Border thickness
        fill: 'rgba(0, 128, 96, 0.2)',  // Semi-transparent green fill
        selectable: true          // Allow the rectangle to be moved/resized
      });

      // Add the rectangle to the canvas
      this.fabricCanvas.add(rect);
    });

    // When the user moves the mouse while drawing
    this.fabricCanvas.on('mouse:move', (o) => {
      if (!isDrawing) return;  // Only do something if we're drawing

      // Get current mouse position
      const pointer = this.fabricCanvas.getPointer(o.e);
      
      // Update rectangle position if drawing backwards/upwards
      if (startX > pointer.x) {
        rect.set({ left: pointer.x });
      }
      if (startY > pointer.y) {
        rect.set({ top: pointer.y });
      }

      // Update rectangle size based on mouse movement
      rect.set({
        width: Math.abs(startX - pointer.x),
        height: Math.abs(startY - pointer.y)
      });

      // Redraw the canvas with the updated rectangle
      this.fabricCanvas.renderAll();
    });

    // When the user releases the mouse button
    this.fabricCanvas.on('mouse:up', () => {
      isDrawing = false;
      // Remove the rectangle if it has no size (just a click, not a drag)
      if (rect.width === 0 || rect.height === 0) {
        this.fabricCanvas.remove(rect);
      }
      // Make this rectangle the active (selected) object
      this.fabricCanvas.setActiveObject(rect);
      // Update the canvas display
      this.fabricCanvas.renderAll();
    });
  }

  // Show the modal window
  openModal() {
    this.modal.style.display = 'block';
  }

  // Hide the modal window and reset everything
  closeModal() {
    this.modal.style.display = 'none';
    this.resetToStep1();
  }

  // Handle when a file is selected through the file input
  handleImageUpload(event) {
    const file = event.target.files[0];  // Get the selected file
    if (file) {
      this.loadImage(file);  // Process the file
    }
  }

  // Handle when a file is being dragged over the drop zone
  handleDragOver(event) {
    event.preventDefault();  // Prevent default browser handling
    event.stopPropagation();  // Stop the event from bubbling up
    this.uploadArea.style.borderColor = '#008060';  // Change border color to show drop zone is active
  }

  // Handle when a file is dropped onto the drop zone
  handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    this.uploadArea.style.borderColor = '#ccc';  // Reset border color
    
    // Get the dropped file and process it if it's an image
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      this.loadImage(file);
    }
  }

  // Load and display an image file on the canvas
  loadImage(file) {
    // Create a FileReader to read the image file
    const reader = new FileReader();
    reader.onload = (e) => {
      // Use Fabric.js to load the image
      fabric.Image.fromURL(e.target.result, (img) => {
        // Calculate scaling to fit the image in our container
        const containerWidth = this.canvasContainer.clientWidth;
        const scale = containerWidth / img.width;
        
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;

        // Create a new canvas with the correct size
        this.initializeFabricCanvas(scaledWidth, scaledHeight);

        // Scale the image and set it as the canvas background
        img.scale(scale);
        this.fabricCanvas.setBackgroundImage(img, this.fabricCanvas.renderAll.bind(this.fabricCanvas));

        // Move to the selection step
        this.step1.classList.add('hidden');
        this.step2.classList.remove('hidden');
      });
    };
    // Start reading the file
    reader.readAsDataURL(file);
  }

  // Remove the last selected area
  undoLastSelection() {
    const activeObject = this.fabricCanvas.getActiveObject();
    if (activeObject) {
      this.fabricCanvas.remove(activeObject);
    }
  }

  // Clear all selected areas
  clearSelection() {
    // Remove all objects except the background image
    this.fabricCanvas.getObjects().slice().forEach(obj => {
      if (obj !== this.fabricCanvas.backgroundImage) {
        this.fabricCanvas.remove(obj);
      }
    });
  }

  // Generate a mask image from the selected areas
  // A mask is a black and white image where white areas show where the curtains should go
  async generateMaskFromSelection() {
    // Create a new canvas for the mask
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = this.fabricCanvas.width;
    maskCanvas.height = this.fabricCanvas.height;
    const maskCtx = maskCanvas.getContext('2d');

    // Fill the entire mask with black
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    // Draw white rectangles for all selected areas
    maskCtx.fillStyle = 'white';
    this.fabricCanvas.getObjects().forEach(obj => {
      if (obj instanceof fabric.Rect) {
        maskCtx.fillRect(obj.left, obj.top, obj.width * obj.scaleX, obj.height * obj.scaleY);
      }
    });

    // Convert the mask canvas to a PNG blob
    return new Promise((resolve) => {
      maskCanvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  }

  // Generate the curtain preview using the selected areas
  async generatePreview() {
    // Check if there are any selections
    const selections = this.fabricCanvas.getObjects().filter(obj => obj instanceof fabric.Rect);
    if (selections.length === 0) {
      alert('Please select at least one window area');
      return;
    }

    // Show loading state
    this.step2.classList.add('hidden');
    this.loadingState.classList.remove('hidden');

    try {
      // Generate the mask image from our selections
      const maskBlob = await this.generateMaskFromSelection();
      
      // Create form data to send to the server
      const formData = new FormData();
      this.fabricCanvas.toBlob(async (imageBlob) => {
        // Add all necessary data to the form
        formData.append('image', imageBlob);
        formData.append('mask', maskBlob);
        formData.append('productId', this.productId);
        formData.append('variantId', this.variantId);

        try {
          // Send the data to our server API
          const response = await fetch('/api/generateProductPreview', {
            method: 'POST',
            body: formData
          });

          if (!response.ok) {
            throw new Error('Failed to generate preview');
          }

          // Get the result and display it
          const result = await response.json();
          this.resultImage.src = result.generatedImageUrl;
          
          // Show the result
          this.loadingState.classList.add('hidden');
          this.step3.classList.remove('hidden');
        } catch (error) {
          // Handle any errors that occur during the API call
          console.error('Error generating preview:', error);
          alert('Failed to generate preview. Please try again.');
          this.loadingState.classList.add('hidden');
          this.step2.classList.remove('hidden');
        }
      }, 'image/png');
    } catch (error) {
      // Handle any errors that occur during mask generation
      console.error('Error preparing images:', error);
      alert('Failed to prepare images. Please try again.');
      this.loadingState.classList.add('hidden');
      this.step2.classList.remove('hidden');
    }
  }

  // Reset everything back to the first step
  resetToStep1() {
    // Hide all steps except step 1
    this.step3.classList.add('hidden');
    this.step2.classList.add('hidden');
    this.loadingState.classList.add('hidden');
    this.step1.classList.remove('hidden');
    
    // Clean up the canvas
    if (this.fabricCanvas) {
      this.fabricCanvas.dispose();
      this.fabricCanvas = null;
    }
    
    // Clear the file input
    this.imageInput.value = '';
  }

  // Add the current product to the cart
  async addToCart() {
    try {
      // Create the cart data
      const formData = {
        items: [{
          id: this.variantId,
          quantity: 1
        }]
      };

      // Send request to Shopify's cart API
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to add to cart');
      }

      // Close the modal after successful add to cart
      this.closeModal();
    } catch (error) {
      // Handle any errors during add to cart
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    }
  }
}

// When the webpage is fully loaded, set up the visualizer
document.addEventListener('DOMContentLoaded', () => {
  // First load the Fabric.js library from a CDN (Content Delivery Network)
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js';
  
  // Once Fabric.js is loaded, create our visualizer
  script.onload = () => {
    new CurtainVisualizer();
  };
  
  // Add the script to the webpage
  document.head.appendChild(script);
});
