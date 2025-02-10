// Service class for handling image processing and manipulation
class ImageService {
  // Convert a file to a data URL
  static async fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  // Generate a mask image from the selected areas on the canvas
  static async generateMaskFromSelection(fabricCanvas) {
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = fabricCanvas.width;
    maskCanvas.height = fabricCanvas.height;
    const maskCtx = maskCanvas.getContext('2d');

    // Fill with black background
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    // Draw white rectangles for selected areas
    maskCtx.fillStyle = 'white';
    fabricCanvas.getObjects().forEach(obj => {
      if (obj instanceof fabric.Rect) {
        maskCtx.fillRect(obj.left, obj.top, obj.width * obj.scaleX, obj.height * obj.scaleY);
      }
    });

    return new Promise((resolve) => {
      maskCanvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  }

  // Scale an image to fit within a container while maintaining aspect ratio
  static calculateImageDimensions(imageWidth, imageHeight, containerWidth) {
    const scale = containerWidth / imageWidth;
    return {
      width: imageWidth * scale,
      height: imageHeight * scale,
      scale
    };
  }
}
