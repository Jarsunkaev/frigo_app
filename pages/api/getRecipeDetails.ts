// pages/api/getRecipeDetails.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function getRecipeDetails(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('getRecipeDetails API called');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Please use GET.' });
  }

  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ 
      error: 'Invalid recipe ID. Please provide a valid recipe ID.' 
    });
  }

  // Validate ID is a number
  const recipeId = parseInt(id, 10);
  if (isNaN(recipeId)) {
    return res.status(400).json({ 
      error: 'Invalid recipe ID format. ID must be a number.' 
    });
  }

  try {
    if (!process.env.SPOONACULAR_API_KEY) {
      console.error('SPOONACULAR_API_KEY is not defined');
      return res.status(500).json({ 
        error: 'Server configuration error. Please contact support.' 
      });
    }

    console.log(`Fetching recipe details for ID: ${recipeId}`);
    
    const queryParams = new URLSearchParams({
      apiKey: process.env.SPOONACULAR_API_KEY,
      includeNutrition: 'false'
    });

    const response = await axios.get(
      `https://api.spoonacular.com/recipes/${recipeId}/information?${queryParams.toString()}`,
      { timeout: 10000 } // 10 second timeout
    );

    // Log response data structure for debugging
    console.log(`Recipe ${recipeId} structure:`, {
      hasInstructions: Boolean(response.data.instructions),
      instructionsLength: response.data.instructions ? response.data.instructions.length : 0,
      hasAnalyzedInstructions: Boolean(response.data.analyzedInstructions && response.data.analyzedInstructions.length),
      analyzedStepsCount: response.data.analyzedInstructions && response.data.analyzedInstructions[0] 
        ? response.data.analyzedInstructions[0].steps.length 
        : 0
    });

    // Extract and format the relevant information
    const recipe = response.data;

    // Format ingredients if they exist
    const formattedIngredients = recipe.extendedIngredients?.map(ingredient => ({
      id: ingredient.id,
      original: ingredient.original,
      amount: ingredient.amount,
      unit: ingredient.unit,
      meta: ingredient.meta
    })) || [];

    // Format instructions if they exist
    const formattedInstructions = recipe.analyzedInstructions?.[0]?.steps?.map(step => ({
      number: step.number,
      instruction: step.step,
      ingredients: step.ingredients?.map(ing => ing.name) || [],
      equipment: step.equipment?.map(eq => eq.name) || []
    })) || [];

    const formattedRecipe = {
      id: recipeId,
      title: recipe.title,
      servings: recipe.servings,
      readyInMinutes: recipe.readyInMinutes,
      image: recipe.image,
      instructions: recipe.instructions, // Include the raw instructions string
      sourceUrl: recipe.sourceUrl,
      extendedIngredients: formattedIngredients,
      steps: formattedInstructions, // Include the formatted steps
      analyzedInstructions: recipe.analyzedInstructions, // Include the original analyzedInstructions
      diets: recipe.diets || [],
      vegetarian: recipe.vegetarian || false,
      vegan: recipe.vegan || false,
      glutenFree: recipe.glutenFree || false,
      dairyFree: recipe.dairyFree || false
    };

    // Cache headers for better performance
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    
    return res.status(200).json(formattedRecipe);

  } catch (error) {
    console.error('Recipe details error:', error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        return res.status(404).json({ 
          error: 'Recipe not found. Please check the recipe ID.' 
        });
      }
      if (error.response?.status === 402) {
        return res.status(503).json({ 
          error: 'API quota exceeded. Please try again later.' 
        });
      }
      if (error.response?.status === 429) {
        return res.status(429).json({ 
          error: 'Too many requests. Please try again in a moment.' 
        });
      }
      return res.status(error.response?.status || 500).json({
        error: 'Failed to fetch recipe details from external service.',
        details: error.response?.data
      });
    }

    return res.status(500).json({ 
      error: 'An unexpected error occurred. Please try again.' 
    });
  }
}