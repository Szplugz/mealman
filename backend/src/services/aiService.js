const { OpenAI } = require('openai');
const logger = require('../utils/logger');
const { HttpError } = require('../utils/errors');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Service for AI-based recipe detection and extraction
 */
const aiService = {
  /**
   * Detects if content contains a recipe
   * @param {Object} content - Content extracted from URL
   * @param {string} mediaType - Type of media (webpage, youtube, etc.)
   * @returns {Object} Object with detection results
   */
  async detectRecipe(content, mediaType) {
    try {
      logger.info(`Detecting recipe in ${mediaType} content`);
      
      let promptText;
      
      switch (mediaType) {
        case 'webpage':
          promptText = this.createWebpageDetectionPrompt(content);
          break;
        case 'youtube':
          promptText = this.createYoutubeDetectionPrompt(content);
          break;
        case 'instagram':
        case 'twitter':
          promptText = this.createSocialMediaDetectionPrompt(content, mediaType);
          break;
        default:
          throw new HttpError(400, `Unsupported media type: ${mediaType}`);
      }
      
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an AI specialized in identifying recipes in content from various sources. 
                      Your task is to determine whether the provided content contains a recipe or cooking instructions.
                      A recipe typically includes ingredients and instructions for preparing a dish.
                      Respond in JSON format with the following fields:
                      - hasRecipe: boolean indicating if a recipe is present
                      - confidence: number between 0 and 1 indicating confidence level
                      - recipeType: string describing the type of recipe (e.g., "baking", "main dish", etc.) or null if no recipe`
          },
          {
            role: "user",
            content: promptText
          }
        ],
        response_format: { type: "json_object" }
      });
      
      const result = JSON.parse(response.choices[0].message.content);
      logger.info(`Recipe detection result: ${JSON.stringify(result)}`);
      
      return {
        hasRecipe: result.hasRecipe,
        confidence: result.confidence,
        recipeType: result.recipeType
      };
    } catch (error) {
      logger.error(`Error in recipe detection: ${error.message}`);
      throw new HttpError(500, `AI detection failed: ${error.message}`);
    }
  },

  /**
   * Creates a prompt for recipe detection in webpage content
   * @param {Object} content - Webpage content
   * @returns {string} Prompt text
   */
  createWebpageDetectionPrompt(content) {
    let promptText = `Analyze the following webpage content and determine if it contains a recipe:\n\n`;
    
    // Include schema.org data if available
    if (content.schemaJson && content.schemaJson.length > 0) {
      promptText += `JSON-LD Schema Data:\n${JSON.stringify(content.schemaJson)}\n\n`;
    }
    
    promptText += `Title: ${content.title}\n`;
    promptText += `Description: ${content.metaDescription}\n\n`;
    
    // Include main content or part of body
    if (content.mainContent) {
      promptText += `Main Content:\n${content.mainContent.substring(0, 3000)}...\n\n`;
    } else if (content.body) {
      promptText += `Page Content:\n${content.body.substring(0, 3000)}...\n\n`;
    }
    
    return promptText;
  },

  /**
   * Creates a prompt for recipe detection in YouTube content
   * @param {Object} content - YouTube content
   * @returns {string} Prompt text
   */
  createYoutubeDetectionPrompt(content) {
    let promptText = `Analyze the following YouTube video information and determine if it contains a recipe:\n\n`;
    
    promptText += `Title: ${content.title}\n`;
    promptText += `Description:\n${content.description}\n\n`;
    
    if (content.transcript) {
      // Include part of the transcript
      promptText += `Transcript (partial):\n${content.transcript.substring(0, 3000)}...\n\n`;
    }
    
    return promptText;
  },

  /**
   * Creates a prompt for recipe detection in social media content
   * @param {Object} content - Social media content
   * @param {string} mediaType - Type of social media
   * @returns {string} Prompt text
   */
  createSocialMediaDetectionPrompt(content, mediaType) {
    let promptText = `Analyze the following ${mediaType} post and determine if it contains a recipe:\n\n`;
    
    if (mediaType === 'instagram') {
      promptText += `Username: ${content.username}\n`;
      promptText += `Caption:\n${content.caption}\n\n`;
      
      if (content.imageUrl) {
        promptText += `(Note: Post includes an image, but it cannot be analyzed directly)\n`;
      }
    } else if (mediaType === 'twitter') {
      promptText += `Username: ${content.username}\n`;
      promptText += `Tweet Text:\n${content.text}\n\n`;
      
      if (content.images && content.images.length > 0) {
        promptText += `(Note: Tweet includes ${content.images.length} image(s), but they cannot be analyzed directly)\n`;
      }
    }
    
    return promptText;
  },

  /**
   * Extracts recipe details from content
   * @param {Object} content - Content extracted from URL
   * @param {string} mediaType - Type of media (webpage, youtube, etc.)
   * @param {string} url - Source URL
   * @returns {Object} Structured recipe data
   */
  async extractRecipe(content, mediaType, url) {
    try {
      logger.info(`Extracting recipe from ${mediaType} content`);
      
      let promptText;
      
      switch (mediaType) {
        case 'webpage':
          promptText = this.createWebpageExtractionPrompt(content);
          break;
        case 'youtube':
          promptText = this.createYoutubeExtractionPrompt(content);
          break;
        case 'instagram':
        case 'twitter':
          promptText = this.createSocialMediaExtractionPrompt(content, mediaType);
          break;
        default:
          throw new HttpError(400, `Unsupported media type: ${mediaType}`);
      }
      
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an AI specialized in extracting recipe information from various sources.
                      Your task is to extract structured recipe data from the provided content.
                      Be comprehensive and accurate. Extract all available information including:
                      - title: The recipe title
                      - description: A brief description of the dish
                      - ingredients: An array of ingredient items with quantities
                      - instructions: An array of step-by-step cooking instructions
                      - prepTime: Preparation time (if available)
                      - cookTime: Cooking time (if available)
                      - totalTime: Total time (if available)
                      - servings: Number of servings (if available)
                      - cuisine: Cuisine type (if available)
                      - author: Recipe author (if available)
                      - notes: Additional notes or tips (if available)
                      - source: Source URL
                      - mediaType: Type of media source
                      
                      Respond in JSON format. For missing information, use null values.`
          },
          {
            role: "user",
            content: promptText
          }
        ],
        response_format: { type: "json_object" }
      });
      
      const extractedData = JSON.parse(response.choices[0].message.content);
      
      // Add source info if not present
      if (!extractedData.source) {
        extractedData.source = url;
      }
      
      if (!extractedData.mediaType) {
        extractedData.mediaType = mediaType;
      }
      
      logger.info(`Successfully extracted recipe: ${extractedData.title}`);
      return extractedData;
    } catch (error) {
      logger.error(`Error in recipe extraction: ${error.message}`);
      throw new HttpError(500, `AI extraction failed: ${error.message}`);
    }
  },

  /**
   * Creates a prompt for recipe extraction from webpage content
   * @param {Object} content - Webpage content
   * @returns {string} Prompt text
   */
  createWebpageExtractionPrompt(content) {
    let promptText = `Extract the recipe from the following webpage content:\n\n`;
    
    // Include schema.org data if available as it's the most structured
    if (content.schemaJson && content.schemaJson.length > 0) {
      promptText += `JSON-LD Schema Data:\n${JSON.stringify(content.schemaJson)}\n\n`;
    }
    
    promptText += `Title: ${content.title}\n`;
    promptText += `Description: ${content.metaDescription}\n\n`;
    
    // Include main content or part of body
    if (content.mainContent) {
      promptText += `Main Content:\n${content.mainContent}\n\n`;
    } else if (content.body) {
      promptText += `Page Content:\n${content.body}\n\n`;
    }
    
    return promptText;
  },

  /**
   * Creates a prompt for recipe extraction from YouTube content
   * @param {Object} content - YouTube content
   * @returns {string} Prompt text
   */
  createYoutubeExtractionPrompt(content) {
    let promptText = `Extract the recipe from the following YouTube video information:\n\n`;
    
    promptText += `Title: ${content.title}\n`;
    promptText += `Description:\n${content.description}\n\n`;
    
    if (content.transcript) {
      promptText += `Transcript:\n${content.transcript}\n\n`;
    }
    
    return promptText;
  },

  /**
   * Creates a prompt for recipe extraction from social media content
   * @param {Object} content - Social media content
   * @param {string} mediaType - Type of social media
   * @returns {string} Prompt text
   */
  createSocialMediaExtractionPrompt(content, mediaType) {
    let promptText = `Extract the recipe from the following ${mediaType} post:\n\n`;
    
    if (mediaType === 'instagram') {
      promptText += `Username: ${content.username}\n`;
      promptText += `Caption:\n${content.caption}\n\n`;
    } else if (mediaType === 'twitter') {
      promptText += `Username: ${content.username}\n`;
      promptText += `Tweet Text:\n${content.text}\n\n`;
    }
    
    return promptText;
  }
};

module.exports = aiService;
