// Service class for handling all API calls
class ApiService {
  // Generate a preview using the provided image and mask
  static async generatePreview(imageBlob, maskBlob, productId, variantId) {
    const formData = new FormData();
    formData.append('image', imageBlob);
    formData.append('mask', maskBlob);
    formData.append('productId', productId);
    formData.append('variantId', variantId);

    const response = await fetch('/api/generateProductPreview', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to generate preview');
    }

    return response.json();
  }

  // Add a product to the cart
  static async addToCart(variantId, quantity = 1) {
    const formData = {
      items: [{
        id: variantId,
        quantity
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

    return response.json();
  }
}
