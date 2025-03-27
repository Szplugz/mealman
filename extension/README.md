# Mealman Chrome Extension

This is the frontend Chrome extension for Mealman, a recipe bookmarking tool that uses AI to detect, extract, and save recipes from anywhere on the web.

## Features

- Clean, modern UI built with React, Tailwind CSS, and shadcn UI components
- URL input for recipe detection
- Step-by-step progress tracking
- Recipe preview with ingredient and instruction display
- Markdown download functionality

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build the extension for testing:
   ```bash
   npm run build:extension
   ```

4. Load the unpacked extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` directory

## Project Structure

- `src/` - React application code
  - `components/` - UI components
    - `ui/` - shadcn UI components
  - `api/` - API service for backend communication
  - `App.jsx` - Main application component
- `public/` - Static assets like icons
- `background.js` - Chrome extension background script
- `contentScript.js` - Content script that runs in web pages
- `manifest.json` - Chrome extension configuration

## Building for Production

```bash
npm run build:extension
```

This will create a `dist` directory with the production build of the extension that can be submitted to the Chrome Web Store.

## Dependencies

- React 18
- Tailwind CSS
- shadcn UI components
- React Query for API data fetching
- Vite for bundling
