# Mealman Backend API

This is the backend service for the Mealman recipe bookmarking Chrome extension. It provides AI-powered recipe detection, extraction, and markdown conversion.

## Features

- Recipe detection across various media types (web pages, YouTube videos, social media)
- Intelligent recipe extraction using OpenAI
- Markdown formatting for standardized recipe output
- Support for various content sources with specialized handlers

## API Endpoints

- `POST /api/detect` - Detects if a URL contains a recipe
- `POST /api/extract` - Extracts recipe details from a URL
- `POST /api/convert` - Converts structured recipe data to markdown format

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Add your API keys:
   - OpenAI API key (required)
   - YouTube API key (optional, for YouTube content)

4. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment on Railway

This service is designed to be deployed on Railway:

1. Connect your GitHub repository to Railway
2. Set up the required environment variables
3. Deploy the application

## Architecture

The backend follows a clean architecture with:
- Controllers for handling API requests
- Services for business logic
- Middleware for cross-cutting concerns
- Utilities for common functionality

## Media Handlers

Specialized handlers for different content types:
- Web page scraper (standard recipe sites)
- YouTube video transcripts
- Social media content (Instagram, Twitter)

## Dependencies

- Node.js v18+
- Express.js
- OpenAI API
- Cheerio for HTML parsing
- Puppeteer for JavaScript-heavy sites
- YouTube Transcript API
