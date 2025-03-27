const logger = require('../utils/logger');

/**
 * Service for formatting recipe data into markdown
 */
const markdownFormatter = {
  /**
   * Formats structured recipe data into markdown
   * @param {Object} recipe - Structured recipe data
   * @returns {string} Markdown formatted recipe
   */
  formatRecipe(recipe) {
    try {
      logger.info(`Formatting recipe to markdown: ${recipe.title}`);
      
      let markdown = '';
      
      // Title
      markdown += `# ${recipe.title}\n\n`;
      
      // Source attribution
      if (recipe.source) {
        markdown += `> Recipe from: [${new URL(recipe.source).hostname}](${recipe.source})\n\n`;
      }
      
      // Description
      if (recipe.description) {
        markdown += `${recipe.description}\n\n`;
      }
      
      // Metadata section
      const metadataItems = [];
      
      if (recipe.prepTime) metadataItems.push(`**Prep Time:** ${recipe.prepTime}`);
      if (recipe.cookTime) metadataItems.push(`**Cook Time:** ${recipe.cookTime}`);
      if (recipe.totalTime) metadataItems.push(`**Total Time:** ${recipe.totalTime}`);
      if (recipe.servings) metadataItems.push(`**Servings:** ${recipe.servings}`);
      if (recipe.cuisine) metadataItems.push(`**Cuisine:** ${recipe.cuisine}`);
      if (recipe.author) metadataItems.push(`**Author:** ${recipe.author}`);
      
      if (metadataItems.length > 0) {
        markdown += `## 📑 Details\n\n`;
        markdown += metadataItems.join(' | ') + '\n\n';
      }
      
      // Ingredients section
      if (recipe.ingredients && recipe.ingredients.length > 0) {
        markdown += `## 🧾 Ingredients\n\n`;
        
        // Check if ingredients is an array of strings or objects
        if (typeof recipe.ingredients[0] === 'string') {
          recipe.ingredients.forEach(ingredient => {
            markdown += `- ${ingredient}\n`;
          });
        } else {
          // Handle structured ingredients object (with quantity, unit, name properties)
          recipe.ingredients.forEach(ingredient => {
            if (typeof ingredient === 'object') {
              const { quantity, unit, name, notes } = ingredient;
              let ingredientText = '- ';
              
              if (quantity) ingredientText += quantity + ' ';
              if (unit) ingredientText += unit + ' ';
              if (name) ingredientText += name;
              if (notes) ingredientText += ` (${notes})`;
              
              markdown += ingredientText + '\n';
            } else {
              markdown += `- ${ingredient}\n`;
            }
          });
        }
        
        markdown += '\n';
      }
      
      // Instructions section
      if (recipe.instructions && recipe.instructions.length > 0) {
        markdown += `## 👨‍🍳 Instructions\n\n`;
        
        if (typeof recipe.instructions[0] === 'string') {
          recipe.instructions.forEach((instruction, index) => {
            markdown += `${index + 1}. ${instruction}\n\n`;
          });
        } else {
          // Handle structured instructions object
          recipe.instructions.forEach((instruction, index) => {
            if (typeof instruction === 'object' && instruction.text) {
              markdown += `${index + 1}. ${instruction.text}\n\n`;
            } else {
              markdown += `${index + 1}. ${instruction}\n\n`;
            }
          });
        }
      }
      
      // Notes section
      if (recipe.notes) {
        markdown += `## 📝 Notes\n\n`;
        
        if (Array.isArray(recipe.notes)) {
          recipe.notes.forEach(note => {
            markdown += `- ${note}\n`;
          });
        } else {
          markdown += recipe.notes + '\n';
        }
        
        markdown += '\n';
      }
      
      // Footer with extraction info
      markdown += `---\n`;
      markdown += `*This recipe was automatically extracted from ${recipe.mediaType || 'web'} content by Mealman.*\n`;
      
      return markdown;
    } catch (error) {
      logger.error(`Error formatting recipe to markdown: ${error.message}`);
      return `# ${recipe.title || 'Recipe'}\n\nError formatting recipe: ${error.message}\n\nOriginal data:\n\`\`\`json\n${JSON.stringify(recipe, null, 2)}\n\`\`\``;
    }
  }
};

module.exports = markdownFormatter;
