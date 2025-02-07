class CurtainVisualizer {
  constructor() {
    this.initializeElements();
    this.setupEventListeners();
    this.initializeCanvas();
    this.lassoPoints = [];
    this.isDrawing = false;
  }

  initializeElements() {
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

    // Containers and elements
    this.modal = document.getElementById('visualizerModal');
    this.step1 = document.getElementById('step1');
    this.step2 = document.getElementById('step2');
    this.step3 = document.getElementById('step3');
    this.loadingState = document.getElementById('loadingState');
    this.canvas = document.getElementById('selectionCanvas');
    this.resultImage = document.getElementById('resultImage');
    this.uploadArea = document.getElementById('uploadArea');

    // Get product information
    this.productId = document.querySelector('.curtain-visualizer').dataset.productId;
    this.variantId = document.querySelector('.curtain-visualizer').dataset.variantId;
  }

  setupEventListeners() {
    // Modal controls
    this.openButton.addEventListener('click', () => this.openModal());
    this.closeButton.addEventListener('click', () => this.closeModal());

    // Upload handlers
    this.uploadButton.addEventListener('click', () => this.imageInput.click());
    this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
    this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
    this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));

    // Canvas controls
    this.undoButton.addEventListener('click', () => this.undoLastPoint());
    this.clearButton.addEventListener('click', () => this.clearSelection());
    this.confirmButton.addEventListener('click', () => this.generatePreview());
    
    // Result controls
    this.tryAgainButton.addEventListener('click', () => this.resetToStep1());
    this.addToCartButton.addEventListener('click', () => this.addToCart());
  }

  initializeCanvas() {
    this.ctx = this.canvas.getContext('2d');
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    this.canvas.addEventListener('mouseup', () => this.stopDrawing());
    this.canvas.addEventListener('mouseout', () => this.stopDrawing());
  }

  openModal() {
    this.modal.style.display = 'block';
  }

  closeModal() {
    this.modal.style.display = 'none';
    this.resetToStep1();
  }

  handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
      this.loadImage(file);
    }
  }

  handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    this.uploadArea.style.borderColor = '#008060';
  }

  handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    this.uploadArea.style.borderColor = '#ccc';
    
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      this.loadImage(file);
    }
  }

  loadImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.ctx.drawImage(img, 0, 0);
        this.originalImage = img;
        this.step1.classList.add('hidden');
        this.step2.classList.remove('hidden');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  startDrawing(event) {
    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.lassoPoints.push({ x, y });
    this.drawLasso();
  }

  draw(event) {
    if (!this.isDrawing) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.lassoPoints.push({ x, y });
    this.drawLasso();
  }

  stopDrawing() {
    if (this.isDrawing) {
      this.isDrawing = false;
      // Close the path by connecting to the first point
      if (this.lassoPoints.length > 0) {
        this.lassoPoints.push(this.lassoPoints[0]);
        this.drawLasso();
      }
    }
  }

  drawLasso() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.originalImage, 0, 0);
    
    if (this.lassoPoints.length > 0) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.lassoPoints[0].x, this.lassoPoints[0].y);
      
      for (let i = 1; i < this.lassoPoints.length; i++) {
        this.ctx.lineTo(this.lassoPoints[i].x, this.lassoPoints[i].y);
      }
      
      this.ctx.strokeStyle = '#008060';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
  }

  undoLastPoint() {
    if (this.lassoPoints.length > 0) {
      this.lassoPoints.pop();
      this.drawLasso();
    }
  }

  clearSelection() {
    this.lassoPoints = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.originalImage, 0, 0);
  }

  async generateMaskFromLasso() {
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = this.canvas.width;
    maskCanvas.height = this.canvas.height;
    const maskCtx = maskCanvas.getContext('2d');
    
    // Draw the lasso selection in white on black background
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    maskCtx.fillStyle = 'white';
    maskCtx.beginPath();
    maskCtx.moveTo(this.lassoPoints[0].x, this.lassoPoints[0].y);
    
    for (let i = 1; i < this.lassoPoints.length; i++) {
      maskCtx.lineTo(this.lassoPoints[i].x, this.lassoPoints[i].y);
    }
    
    maskCtx.fill();
    
    return new Promise((resolve) => {
      maskCanvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  }

  async generatePreview() {
    if (this.lassoPoints.length < 3) {
      alert('Please select an area first');
      return;
    }

    this.step2.classList.add('hidden');
    this.loadingState.classList.remove('hidden');

    try {
      // Generate the mask from lasso selection
      const maskBlob = await this.generateMaskFromLasso();
      
      // Create form data with both images
      const formData = new FormData();
      this.canvas.toBlob(async (imageBlob) => {
        formData.append('image', imageBlob);
        formData.append('mask', maskBlob);
        formData.append('productId', this.productId);
        formData.append('variantId', this.variantId);

        try {
          const response = await fetch('/api/generateProductPreview', {
            method: 'POST',
            body: formData
          });

          if (!response.ok) {
            throw new Error('Failed to generate preview');
          }

          const result = await response.json();
          this.resultImage.src = result.generatedImageUrl;
          
          this.loadingState.classList.add('hidden');
          this.step3.classList.remove('hidden');
        } catch (error) {
          console.error('Error generating preview:', error);
          alert('Failed to generate preview. Please try again.');
          this.loadingState.classList.add('hidden');
          this.step2.classList.remove('hidden');
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error preparing images:', error);
      alert('Failed to prepare images. Please try again.');
      this.loadingState.classList.add('hidden');
      this.step2.classList.remove('hidden');
    }
  }

  resetToStep1() {
    this.step3.classList.add('hidden');
    this.step2.classList.add('hidden');
    this.loadingState.classList.add('hidden');
    this.step1.classList.remove('hidden');
    this.clearSelection();
    this.lassoPoints = [];
    this.imageInput.value = '';
  }

  async addToCart() {
    try {
      const formData = {
        items: [{
          id: this.variantId,
          quantity: 1
        }]
      };

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

      // Refresh mini-cart or show success message
      this.closeModal();
      // You might want to trigger your theme's cart update function here
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    }
  }
}

// Initialize the visualizer when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new CurtainVisualizer();
});
