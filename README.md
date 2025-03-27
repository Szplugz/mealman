# Mealman: Recipe Bookmarking Chrome Extension

A Chrome extension that uses AI to detect, extract, and save recipes from anywhere on the web.

## Features

- **Universal Recipe Detection**: Works with web pages, YouTube videos, Instagram posts, tweets, and more
- **AI-Powered Extraction**: Uses OpenAI to intelligently parse recipe content
- **Markdown Export**: Formatted recipe downloads for your personal collection
- **Modern UI**: Built with React, Tailwind CSS, and shadcn UI components

## Project Structure

This project consists of two main components:

1. **Backend API** (Node.js/Express)
   - AI-powered recipe detection and extraction
   - Content fetching from various media sources
   - Markdown formatting

2. **Chrome Extension** (React)
   - User-friendly interface for submitting URLs
   - Recipe preview
   - Markdown download functionality

## Development Setup

### Backend

```bash
cd backend
npm install
# Create a .env file based on .env.example
npm run dev
```

### Chrome Extension

```bash
cd extension
npm install
npm run dev     # For development
npm run build   # For production build
```

## Deployment

The backend is designed to be deployed on Railway. The frontend Chrome extension can be loaded as an unpacked extension during development or packaged for the Chrome Web Store.

## Dependencies

- Node.js v18+
- OpenAI API key
- YouTube API key (for video content)

## License

MIT
