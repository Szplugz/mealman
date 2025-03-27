const logger = require('../utils/logger');
const mediaHandler = require('../services/mediaHandler');
const aiService = require('../services/aiService');
const markdownFormatter = require('../services/markdownFormatter');
const { HttpError } = require('../utils/errors');

/**
 * Controller for recipe-related endpoints
 */
const recipeController = {
  /**
   * Detects if a URL contains a recipe
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async detectRecipe(req, res) {
    const { url } = req.body;

    if (!url) {
      throw new HttpError(400, 'URL is required');
    }

    logger.info(`Detecting recipe at URL: ${url}`);
    
    // Get the media type and content
    const { mediaType, content } = await mediaHandler.fetchContent(url);
    
    // Use AI to detect if content contains a recipe
    const { hasRecipe, confidence, recipeType } = await aiService.detectRecipe(content, mediaType);
    
    res.json({
      url,
      mediaType,
      hasRecipe,
      confidence,
      recipeType: hasRecipe ? recipeType : null
    });
  },

  /**
   * Extracts recipe details from a URL
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async extractRecipe(req, res) {
    const { url } = req.body;

    if (!url) {
      throw new HttpError(400, 'URL is required');
    }

    logger.info(`Extracting recipe from URL: ${url}`);
    
    // Get the media type and content
    const { mediaType, content } = await mediaHandler.fetchContent(url);
    
    // First, verify this contains a recipe
    const { hasRecipe } = await aiService.detectRecipe(content, mediaType);
    
    if (!hasRecipe) {
      throw new HttpError(400, 'No recipe detected in the provided URL');
    }
    
    // Extract structured recipe data
    const recipeData = await aiService.extractRecipe(content, mediaType, url);
    
    res.json({
      url,
      mediaType,
      recipe: recipeData
    });
  },

  /**
   * Converts structured recipe data to markdown format
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async convertToMarkdown(req, res) {
    const { recipe } = req.body;

    if (!recipe) {
      throw new HttpError(400, 'Recipe data is required');
    }

    logger.info('Converting recipe to markdown');
    
    // Convert structured recipe data to markdown
    const markdown = markdownFormatter.formatRecipe(recipe);
    
    res.json({
      markdown,
      fileName: `${recipe.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`
    });
  }
};

module.exports = recipeController;
