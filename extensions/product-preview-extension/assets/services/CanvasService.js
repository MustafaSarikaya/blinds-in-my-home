// Service class for managing the Fabric.js canvas and its operations
class CanvasService {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.fabricCanvas = null;
  }

  // Initialize a new Fabric.js canvas
  initialize(width, height) {
    // Remove existing canvas if any
    if (this.canvas) {
      this.canvas.remove();
    }

    // Create new canvas element
    this.canvas = document.createElement('canvas');
    this.container.appendChild(this.canvas);

    // Initialize Fabric canvas
    this.fabricCanvas = new fabric.Canvas(this.canvas, {
      width,
      height,
      selection: false
    });

    this._setupDrawingMode();
    return this.fabricCanvas;
  }

  // Set up rectangle drawing functionality
  _setupDrawingMode() {
    let isDrawing = false;
    let rect;
    let startX, startY;

    this.fabricCanvas.on('mouse:down', (o) => {
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
    });

    this.fabricCanvas.on('mouse:move', (o) => {
      if (!isDrawing) return;

      const pointer = this.fabricCanvas.getPointer(o.e);
      
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
        this.fabricCanvas.remove(rect);
      }
      this.fabricCanvas.setActiveObject(rect);
      this.fabricCanvas.renderAll();
    });
  }

  // Set the background image of the canvas
  setBackgroundImage(imageUrl, scale) {
    return new Promise((resolve) => {
      fabric.Image.fromURL(imageUrl, (img) => {
        img.scale(scale);
        this.fabricCanvas.setBackgroundImage(img, () => {
          this.fabricCanvas.renderAll();
          resolve();
        });
      });
    });
  }

  // Get all rectangle selections on the canvas
  getSelections() {
    return this.fabricCanvas.getObjects().filter(obj => obj instanceof fabric.Rect);
  }

  // Remove the last selected area
  undoLastSelection() {
    const activeObject = this.fabricCanvas.getActiveObject();
    if (activeObject) {
      this.fabricCanvas.remove(activeObject);
      this.fabricCanvas.renderAll();
    }
  }

  // Clear all selections
  clearSelections() {
    this.fabricCanvas.getObjects().slice().forEach(obj => {
      if (obj !== this.fabricCanvas.backgroundImage) {
        this.fabricCanvas.remove(obj);
      }
    });
    this.fabricCanvas.renderAll();
  }

  // Clean up the canvas
  dispose() {
    if (this.fabricCanvas) {
      this.fabricCanvas.dispose();
      this.fabricCanvas = null;
    }
    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
    }
  }
}
