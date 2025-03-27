const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const { YoutubeTranscript } = require('youtube-transcript');
const logger = require('../utils/logger');
const { HttpError } = require('../utils/errors');

/**
 * Media types supported by the application
 */
const MEDIA_TYPES = {
  WEBPAGE: 'webpage',
  YOUTUBE: 'youtube',
  INSTAGRAM: 'instagram',
  TWITTER: 'twitter',
  UNKNOWN: 'unknown'
};

/**
 * Service for handling different media types and content extraction
 */
const mediaHandler = {
  /**
   * Determines the type of media from a URL
   * @param {string} url - The URL to analyze
   * @returns {string} The media type
   */
  determineMediaType(url) {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
        return MEDIA_TYPES.YOUTUBE;
      } else if (hostname.includes('instagram.com')) {
        return MEDIA_TYPES.INSTAGRAM;
      } else if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
        return MEDIA_TYPES.TWITTER;
      } else {
        return MEDIA_TYPES.WEBPAGE;
      }
    } catch (error) {
      logger.error(`Error determining media type: ${error.message}`);
      return MEDIA_TYPES.UNKNOWN;
    }
  },

  /**
   * Fetches content from a URL based on its media type
   * @param {string} url - The URL to fetch content from
   * @returns {Object} Object containing mediaType and content
   */
  async fetchContent(url) {
    if (!url) {
      throw new HttpError(400, 'URL is required');
    }

    const mediaType = this.determineMediaType(url);
    let content;

    try {
      switch (mediaType) {
        case MEDIA_TYPES.YOUTUBE:
          content = await this.fetchYoutubeContent(url);
          break;
        case MEDIA_TYPES.INSTAGRAM:
          content = await this.fetchInstagramContent(url);
          break;
        case MEDIA_TYPES.TWITTER:
          content = await this.fetchTwitterContent(url);
          break;
        case MEDIA_TYPES.WEBPAGE:
          content = await this.fetchWebpageContent(url);
          break;
        default:
          throw new HttpError(400, 'Unsupported media type');
      }

      return { mediaType, content };
    } catch (error) {
      logger.error(`Error fetching content from ${url}: ${error.message}`);
      throw new HttpError(500, `Failed to fetch content: ${error.message}`);
    }
  },

  /**
   * Fetches content from a standard webpage
   * @param {string} url - The webpage URL
   * @returns {Object} Webpage content
   */
  async fetchWebpageContent(url) {
    try {
      // First try simple HTTP request
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MealmanBot/1.0)' }
      });
      
      const $ = cheerio.load(response.data);
      
      // Look for recipe schema markup
      const schemaJson = $('script[type="application/ld+json"]').map((i, el) => {
        try {
          const json = JSON.parse($(el).html());
          return json;
        } catch (e) {
          return null;
        }
      }).get().filter(item => 
        item && 
        (item['@type'] === 'Recipe' || 
         (item['@graph'] && item['@graph'].some(g => g['@type'] === 'Recipe')))
      );
      
      // Extract basic page content
      const title = $('title').text();
      const metaDescription = $('meta[name="description"]').attr('content') || '';
      const body = $('body').text().replace(/\\s+/g, ' ').trim();
      
      // Extract main content area (heuristic approach)
      const mainContent = $('main, article, .content, .recipe, .post, #content')
        .first().html() || '';
      
      return {
        title,
        metaDescription,
        url,
        schemaJson: schemaJson.length > 0 ? schemaJson : null,
        mainContent,
        body: body.substring(0, 10000) // Limit body size
      };
    } catch (error) {
      // If simple request fails, try with Puppeteer for JavaScript-rendered content
      logger.info(`Falling back to Puppeteer for URL: ${url}`);
      return this.fetchWithPuppeteer(url);
    }
  },

  /**
   * Fetches content using Puppeteer for JavaScript-rendered pages
   * @param {string} url - The webpage URL
   * @returns {Object} Webpage content
   */
  async fetchWithPuppeteer(url) {
    let browser = null;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (compatible; MealmanBot/1.0)');
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Get page title and meta description
      const title = await page.title();
      const metaDescription = await page.evaluate(() => {
        const metaDesc = document.querySelector('meta[name="description"]');
        return metaDesc ? metaDesc.getAttribute('content') : '';
      });
      
      // Extract schema.org Recipe data if available
      const schemaJson = await page.evaluate(() => {
        const schemas = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
          .map(script => {
            try {
              return JSON.parse(script.textContent);
            } catch (e) {
              return null;
            }
          })
          .filter(Boolean);
          
        return schemas.filter(schema => 
          schema['@type'] === 'Recipe' || 
          (schema['@graph'] && schema['@graph'].some(g => g['@type'] === 'Recipe'))
        );
      });
      
      // Get HTML of the main content area
      const mainContent = await page.evaluate(() => {
        const main = document.querySelector('main, article, .content, .recipe, .post, #content');
        return main ? main.outerHTML : '';
      });
      
      // Get page body text
      const body = await page.evaluate(() => 
        document.body.innerText.replace(/\\s+/g, ' ').trim()
      );
      
      return {
        title,
        metaDescription,
        url,
        schemaJson: schemaJson.length > 0 ? schemaJson : null,
        mainContent,
        body: body.substring(0, 10000) // Limit body size
      };
    } finally {
      if (browser) await browser.close();
    }
  },

  /**
   * Fetches content from a YouTube video
   * @param {string} url - The YouTube video URL
   * @returns {Object} YouTube video content
   */
  async fetchYoutubeContent(url) {
    try {
      // Extract video ID from URL
      const videoId = this.extractYoutubeId(url);
      if (!videoId) {
        throw new Error('Could not extract YouTube video ID');
      }
      
      // Get video information via API
      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`
      );
      
      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('YouTube video not found');
      }
      
      const videoData = response.data.items[0].snippet;
      
      // Get video transcript
      let transcript;
      try {
        transcript = await YoutubeTranscript.fetchTranscript(videoId);
        transcript = transcript.map(item => item.text).join(' ');
      } catch (err) {
        logger.warn(`Could not fetch YouTube transcript: ${err.message}`);
        transcript = null;
      }
      
      return {
        title: videoData.title,
        description: videoData.description,
        url,
        videoId,
        transcript
      };
    } catch (error) {
      logger.error(`Error fetching YouTube content: ${error.message}`);
      throw new Error(`Failed to fetch YouTube content: ${error.message}`);
    }
  },

  /**
   * Extracts YouTube video ID from various URL formats
   * @param {string} url - The YouTube URL
   * @returns {string|null} YouTube video ID or null if not found
   */
  extractYoutubeId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/watch\?.*&v=)([^&?/]+)/,
      /youtube\.com\/watch\?.*v=([^&]+)/,
      /youtu\.be\/([^?&]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  },

  /**
   * Fetches content from an Instagram post
   * @param {string} url - The Instagram post URL
   * @returns {Object} Instagram post content
   */
  async fetchInstagramContent(url) {
    // Note: Instagram requires authentication for API access
    // For now, we'll use Puppeteer to scrape public content
    let browser = null;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (compatible; MealmanBot/1.0)');
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Extract post data using selectors
      const postData = await page.evaluate(() => {
        const caption = document.querySelector('div[class*="caption"]')?.textContent || '';
        const username = document.querySelector('a[class*="header"]')?.textContent || '';
        const imgSrc = document.querySelector('img[class*="image"]')?.src || '';
        
        return { caption, username, imgSrc };
      });
      
      return {
        type: 'instagram',
        url,
        username: postData.username,
        caption: postData.caption,
        imageUrl: postData.imgSrc
      };
    } catch (error) {
      logger.error(`Error fetching Instagram content: ${error.message}`);
      throw new Error(`Failed to fetch Instagram content: ${error.message}`);
    } finally {
      if (browser) await browser.close();
    }
  },

  /**
   * Fetches content from a Twitter/X post
   * @param {string} url - The Twitter/X post URL
   * @returns {Object} Twitter post content
   */
  async fetchTwitterContent(url) {
    // Note: Twitter API requires authentication
    // For now, we'll use Puppeteer to scrape public content
    let browser = null;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (compatible; MealmanBot/1.0)');
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Extract tweet data using selectors
      const tweetData = await page.evaluate(() => {
        const tweetText = document.querySelector('div[data-testid="tweetText"]')?.textContent || '';
        const username = document.querySelector('div[data-testid="User-Name"]')?.textContent || '';
        
        // Check for images
        const images = Array.from(document.querySelectorAll('img[src*="media"]'))
          .map(img => img.src)
          .filter(Boolean);
        
        return { tweetText, username, images };
      });
      
      return {
        type: 'twitter',
        url,
        username: tweetData.username,
        text: tweetData.tweetText,
        images: tweetData.images
      };
    } catch (error) {
      logger.error(`Error fetching Twitter content: ${error.message}`);
      throw new Error(`Failed to fetch Twitter content: ${error.message}`);
    } finally {
      if (browser) await browser.close();
    }
  }
};

module.exports = mediaHandler;
