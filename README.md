# Blinds in My Home - Shopify App

A Shopify app that allows customers to visualize curtains and blinds in their room photos using an interactive canvas interface.

## Features

- Upload room photos via drag & drop or file selection
- Interactive window area selection using Fabric.js canvas
- Real-time curtain visualization
- Seamless integration with Shopify product pages
- Mobile-responsive design

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli/installation)

## Setup Instructions

1. **Install Shopify CLI**
   ```bash
   npm install -g @shopify/cli @shopify/theme
   ```

2. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/blinds-in-my-home.git
   cd blinds-in-my-home
   ```

3. **Install Dependencies**
   ```bash
   yarn install
   ```

4. **Configure Development Store**
   - Go to [Shopify Partners Dashboard](https://partners.shopify.com)
   - Create or select a development store
   - Note down your store URL (e.g., your-store.myshopify.com)

5. **Authentication**
   ```bash
   shopify auth login --store your-store.myshopify.com
   ```

6. **Connect to Your Development Store**
   ```bash
   shopify app connect
   ```

7. **Start Development Server**
   ```bash
   shopify app dev
   ```

## Development

The app uses the following structure:
- `/extensions/product-preview-extension/` - Main app extension
  - `/assets/` - JavaScript and CSS files
  - `/blocks/` - Liquid templates
- `/api/` - Backend API endpoints
- `/web/` - Frontend React application

## Testing

1. After starting the development server, open your development store
2. Navigate to a product page
3. Look for the "Try In Your Space" button
4. Upload a room photo and test the curtain visualization

## Deployment

1. **Prepare for Production**
   ```bash
   shopify app build
   ```

2. **Deploy to Shopify**
   ```bash
   shopify app deploy
   ```

## Troubleshooting

Common issues and solutions:

1. **Canvas Not Displaying**
   - Check browser console for errors
   - Ensure Fabric.js is loaded properly
   - Verify image upload permissions

2. **Authentication Issues**
   - Run `shopify auth logout` and login again
   - Verify development store URL
   - Check Partner Dashboard permissions

3. **Extension Not Loading**
   - Clear browser cache
   - Check theme.liquid for app block inclusion
   - Verify app registration in Partner Dashboard

## Support

For issues and feature requests, please:
1. Check existing GitHub issues
2. Create a new issue with detailed description
3. Include browser console logs if relevant

## License

This project is licensed under the CC BY-NC License - see the LICENSE file for details.
