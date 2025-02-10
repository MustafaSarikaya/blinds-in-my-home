// Main controller class that coordinates between services and UI
class CurtainVisualizerController {
  constructor() {
    this.initializeElements();
    this.setupEventListeners();
    
    // Initialize services
    this.canvasService = new CanvasService(this.canvasContainer);
    
    // Store product information
    this.productId = document.querySelector('.curtain-visualizer').dataset.productId;
    this.variantId = document.querySelector('.curtain-visualizer').dataset.variantId;
  }

  // Initialize UI elements
  initializeElements() {
    // Modal elements
    this.modal = document.getElementById('visualizerModal');
    this.step1 = document.getElementById('step1');
    this.step2 = document.getElementById('step2');
    this.step3 = document.getElementById('step3');
    this.loadingState = document.getElementById('loadingState');
    
    // Buttons
    this.openButton = document.getElementById('openVisualizerBtn');
    this.closeButton = document.getElementById('closeVisualizerBtn');
    this.uploadButton = document.getElementById('uploadButton');
    this.undoButton = document.getElementById('undoButton');
    this.clearButton = document.getElementById('clearButton');
    this.confirmButton = document.getElementById('confirmButton');
    this.tryAgainButton = document.getElementById('tryAgainButton');
    this.addToCartButton = document.getElementById('addToCartButton');
    
    // Other elements
    this.imageInput = document.getElementById('imageInput');
    this.canvasContainer = document.getElementById('selectionCanvas').parentElement;
    this.resultImage = document.getElementById('resultImage');
    this.uploadArea = document.getElementById('uploadArea');
  }

  // Set up event listeners
  setupEventListeners() {
    // Modal controls
    this.openButton.addEventListener('click', () => this.openModal());
    this.closeButton.addEventListener('click', () => this.closeModal());

    // File upload handlers
    this.uploadButton.addEventListener('click', () => this.imageInput.click());
    this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
    this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
    this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));

    // Selection controls
    this.undoButton.addEventListener('click', () => this.canvasService.undoLastSelection());
    this.clearButton.addEventListener('click', () => this.canvasService.clearSelections());
    this.confirmButton.addEventListener('click', () => this.generatePreview());

    // Result controls
    this.tryAgainButton.addEventListener('click', () => this.resetToStep1());
    this.addToCartButton.addEventListener('click', () => this.addToCart());
  }

  // Modal control methods
  openModal() {
    this.modal.style.display = 'block';
  }

  closeModal() {
    this.modal.style.display = 'none';
    this.resetToStep1();
  }

  // File handling methods
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

  async handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
      await this.loadImage(file);
    }
  }

  // Image loading and processing
  async loadImage(file) {
    try {
      const dataUrl = await ImageService.fileToDataUrl(file);
      
      // Create temporary image to get dimensions
      const img = new Image();
      img.src = dataUrl;
      
      await new Promise((resolve) => {
        img.onload = () => {
          const { width, height, scale } = ImageService.calculateImageDimensions(
            img.width,
            img.height,
            this.canvasContainer.clientWidth
          );

          // Initialize canvas with calculated dimensions
          this.canvasService.initialize(width, height);
          
          // Set the background image
          this.canvasService.setBackgroundImage(dataUrl, scale)
            .then(() => {
              this.step1.classList.add('hidden');
              this.step2.classList.remove('hidden');
            });
          
          resolve();
        };
      });
    } catch (error) {
      console.error('Error loading image:', error);
      alert('Failed to load image. Please try again.');
    }
  }

  // Preview generation
  async generatePreview() {
    const selections = this.canvasService.getSelections();
    if (selections.length === 0) {
      alert('Please select at least one window area');
      return;
    }

    this.step2.classList.add('hidden');
    this.loadingState.classList.remove('hidden');

    try {
      const maskBlob = await ImageService.generateMaskFromSelection(this.canvasService.fabricCanvas);
      
      this.canvasService.fabricCanvas.toBlob(async (imageBlob) => {
        try {
          const result = await ApiService.generatePreview(
            imageBlob,
            maskBlob,
            this.productId,
            this.variantId
          );

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

  // Reset the visualizer
  resetToStep1() {
    this.step3.classList.add('hidden');
    this.step2.classList.add('hidden');
    this.loadingState.classList.add('hidden');
    this.step1.classList.remove('hidden');
    
    this.canvasService.dispose();
    this.imageInput.value = '';
  }

  // Cart operations
  async addToCart() {
    try {
      await ApiService.addToCart(this.variantId);
      this.closeModal();
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    }
  }
}
