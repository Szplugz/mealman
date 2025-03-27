// contentScript.js - Runs in the context of web pages

/**
 * Helper function to extract structured recipe data if available on the page
 * Looks for JSON-LD schema.org Recipe markup
 */
function extractStructuredRecipeData() {
  // Look for JSON-LD script tags with Recipe schema
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
  const recipeData = [];

  jsonLdScripts.forEach(script => {
    try {
      const data = JSON.parse(script.textContent);
      
      // Check if it's a Recipe directly
      if (data['@type'] === 'Recipe') {
        recipeData.push(data);
      } 
      // Check if it's a graph with Recipe nodes
      else if (data['@graph'] && Array.isArray(data['@graph'])) {
        const recipes = data['@graph'].filter(item => item['@type'] === 'Recipe');
        if (recipes.length > 0) {
          recipeData.push(...recipes);
        }
      }
    } catch (error) {
      // Silently fail if JSON parsing fails
    }
  });

  return recipeData.length > 0 ? recipeData : null;
}

/**
 * Handles messages from the extension popup or background script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTRACT_STRUCTURED_DATA') {
    // Extract and return structured recipe data if available
    const structuredData = extractStructuredRecipeData();
    sendResponse({ structuredData });
  }
  
  // Return true to indicate we'll respond asynchronously
  return true;
});

// Optional: Listen for messages from the web page
window.addEventListener('message', (event) => {
  // Only accept messages from the same frame
  if (event.source !== window) return;
  
  // Handle specific message types
  if (event.data.type && event.data.type === 'FROM_PAGE_TO_EXTENSION') {
    chrome.runtime.sendMessage({ 
      type: 'FROM_CONTENT_SCRIPT', 
      data: event.data.data 
    });
  }
});
