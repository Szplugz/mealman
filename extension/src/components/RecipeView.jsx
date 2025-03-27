import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Icons } from './Icons';

/**
 * Component to display the extracted recipe information
 * @param {Object} props - Component props 
 * @param {Object} props.recipe - Recipe data object
 * @param {Function} props.onDownload - Function to handle download
 */
export const RecipeView = ({ recipe, onDownload }) => {
  if (!recipe) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{recipe.title}</CardTitle>
        {recipe.description && (
          <CardDescription>{recipe.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recipe metadata */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          {recipe.prepTime && (
            <div className="flex items-center space-x-1">
              <Icons.timer className="h-4 w-4 text-muted-foreground" />
              <span>Prep: {recipe.prepTime}</span>
            </div>
          )}
          {recipe.cookTime && (
            <div className="flex items-center space-x-1">
              <Icons.clock className="h-4 w-4 text-muted-foreground" />
              <span>Cook: {recipe.cookTime}</span>
            </div>
          )}
          {recipe.totalTime && (
            <div className="flex items-center space-x-1">
              <Icons.clock className="h-4 w-4 text-muted-foreground" />
              <span>Total: {recipe.totalTime}</span>
            </div>
          )}
          {recipe.servings && (
            <div className="flex items-center space-x-1">
              <Icons.utensils className="h-4 w-4 text-muted-foreground" />
              <span>Servings: {recipe.servings}</span>
            </div>
          )}
        </div>

        {/* Ingredients Section */}
        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Icons.list className="h-4 w-4 text-primary" />
              <h3 className="font-medium">Ingredients</h3>
            </div>
            <ul className="space-y-1 text-sm pl-2">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="list-disc list-inside">
                  {typeof ingredient === 'string' 
                    ? ingredient 
                    : (
                      <React.Fragment>
                        {ingredient.quantity && `${ingredient.quantity} `}
                        {ingredient.unit && `${ingredient.unit} `}
                        {ingredient.name}
                        {ingredient.notes && <span className="text-muted-foreground"> ({ingredient.notes})</span>}
                      </React.Fragment>
                    )
                  }
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Instructions Section - Show limited instructions */}
        {recipe.instructions && recipe.instructions.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Icons.chef className="h-4 w-4 text-primary" />
              <h3 className="font-medium">Instructions</h3>
            </div>
            <ol className="space-y-2 text-sm pl-2">
              {recipe.instructions.slice(0, 3).map((instruction, index) => (
                <li key={index} className="list-decimal list-inside">
                  {typeof instruction === 'string' 
                    ? instruction 
                    : instruction.text
                  }
                </li>
              ))}
              {recipe.instructions.length > 3 && (
                <li className="text-muted-foreground italic">
                  +{recipe.instructions.length - 3} more steps...
                </li>
              )}
            </ol>
          </div>
        )}

        {/* Source attribution */}
        {recipe.source && (
          <div className="text-xs text-muted-foreground">
            Source: {recipe.source}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={onDownload} className="w-full">
          <Icons.download className="mr-2 h-4 w-4" />
          Download Recipe
        </Button>
      </CardFooter>
    </Card>
  );
};
