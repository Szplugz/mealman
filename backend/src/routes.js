const recipeController = require('./controllers/recipeController');
const asyncHandler = require('./utils/asyncHandler');

/**
 * Configure API routes for the application
 * @param {import('express').Express} app - Express application instance
 */
function setupRoutes(app) {
  // Recipe detection and extraction API endpoints
  app.post('/api/detect', asyncHandler(recipeController.detectRecipe));
  app.post('/api/extract', asyncHandler(recipeController.extractRecipe));
  app.post('/api/convert', asyncHandler(recipeController.convertToMarkdown));
  
  // Catch-all for undefined routes
  app.use('*', (req, res) => {
    res.status(404).json({ 
      error: 'Not Found', 
      message: `Route ${req.originalUrl} not found` 
    });
  });
}

module.exports = { setupRoutes };
