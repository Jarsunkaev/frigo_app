// pages/api/generateMealPlan.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { getAuth } from 'firebase-admin/auth';
import admin from '../../lib/firebaseAdmin';
import { checkAndUpdateGenerationLimit } from '../../utils/recipe-limits';

// Types for Spoonacular API response
interface MealPlanDay {
  meals: Array<{
    id: number;
    title: string;
    imageType: string;
    readyInMinutes: number;
    servings: number;
    sourceUrl: string;
  }>;
  nutrients: {
    calories: number;
    protein: number;
    fat: number;
    carbohydrates: number;
  };
}

interface MealPlanWeek {
  week: {
    monday: MealPlanDay;
    tuesday: MealPlanDay;
    wednesday: MealPlanDay;
    thursday: MealPlanDay;
    friday: MealPlanDay;
    saturday: MealPlanDay;
    sunday: MealPlanDay;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    let userId: string | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      try {
        const decodedToken = await getAuth().verifyIdToken(idToken);
        userId = decodedToken.uid;
      } catch (error) {
        console.error('Error verifying auth token:', error);
        return res.status(401).json({ error: 'Unauthorized' });
      }
    } else {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user has reached generation limit
    const canGenerate = await checkAndUpdateGenerationLimit(userId);
    if (!canGenerate) {
      return res.status(429).json({ error: 'Daily generation limit reached. Please try again tomorrow or upgrade your plan.' });
    }
    
    // Extract request parameters
    const { 
      timeFrame = 'week',
      targetCalories,
      diet,
      exclude,
      ingredients = []
    } = req.body;
    
    // Check user's subscription tier to determine feature access
    const userRef = admin.firestore().collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    const isPremium = userData.subscriptionTier === 'premium';

    // Construct query parameters
    const queryParams = new URLSearchParams({
      apiKey: process.env.SPOONACULAR_API_KEY || '',
      timeFrame: timeFrame
    });
    
    if (targetCalories) queryParams.append('targetCalories', targetCalories.toString());
    if (diet) queryParams.append('diet', diet);
    
    // If ingredients are provided, use them in 'includeIngredients'
    if (ingredients.length > 0) {
      queryParams.append('includeIngredients', ingredients.join(','));
    }
    
    // If exclude ingredients are provided
    if (exclude) queryParams.append('exclude', exclude);

    // Make request to Spoonacular API
    console.log(`Making request to Spoonacular meal planner API: ${timeFrame}`);
    const response = await axios.get(
      `https://api.spoonacular.com/mealplanner/generate?${queryParams.toString()}`,
      { 
        timeout: 15000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Process response to create shopping list for missing ingredients
    const mealPlanData = response.data;
    
    // For free tier users, limit the results
    if (!isPremium && timeFrame === 'week') {
      // Limit to 3 days for free users
      const limitedMealPlan = {
        week: {
          monday: mealPlanData.week.monday,
          tuesday: mealPlanData.week.tuesday,
          wednesday: mealPlanData.week.wednesday
        }
      };
      return res.status(200).json({
        mealPlan: limitedMealPlan,
        isPremium: false,
        message: 'Showing 3-day meal plan. Upgrade to Premium for full 7-day plans.'
      });
    }
    
    // Generate shopping list for missing ingredients
    const recipeIds = extractRecipeIds(mealPlanData, timeFrame);
    let shoppingList = [];
    
    if (recipeIds.length > 0) {
      try {
        // Get ingredients for all recipes in the meal plan
        const ingredientsResponse = await axios.get(
          `https://api.spoonacular.com/recipes/informationBulk?ids=${recipeIds.join(',')}&apiKey=${process.env.SPOONACULAR_API_KEY}`,
          { timeout: 15000 }
        );
        
        shoppingList = await generateShoppingList(ingredientsResponse.data, ingredients);
      } catch (error) {
        console.error('Error generating shopping list:', error);
        // Continue even if shopping list generation fails
        shoppingList = [];
      }
    }
    
    // Log meal plan generation
    await admin.firestore().collection('mealPlanLogs').add({
      userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      timeFrame,
      recipeCount: recipeIds.length,
      subscriptionTier: isPremium ? 'premium' : 'free'
    });
    
    // Return meal plan data with shopping list
    return res.status(200).json({
      mealPlan: mealPlanData,
      shoppingList,
      isPremium: isPremium
    });
    
  } catch (error: any) {
    console.error('Error generating meal plan:', error);
    
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      
      if (statusCode === 402 || statusCode === 429) {
        return res.status(429).json({ 
          error: 'API request limit reached. Please try again later.' 
        });
      }
      
      return res.status(statusCode).json({
        error: 'Error from recipe service',
        details: error.response?.data || error.message
      });
    }
    
    return res.status(500).json({ 
      error: 'An unexpected error occurred. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Helper function to extract recipe IDs from meal plan
function extractRecipeIds(mealPlanData: any, timeFrame: string): number[] {
  const recipeIds: number[] = [];
  
  if (timeFrame === 'day' && mealPlanData.meals) {
    mealPlanData.meals.forEach((meal: any) => {
      if (meal.id) recipeIds.push(meal.id);
    });
  } else if (timeFrame === 'week' && mealPlanData.week) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    days.forEach(day => {
      if (mealPlanData.week[day] && mealPlanData.week[day].meals) {
        mealPlanData.week[day].meals.forEach((meal: any) => {
          if (meal.id) recipeIds.push(meal.id);
        });
      }
    });
  }
  
  return recipeIds;
}

// Generate shopping list by comparing recipe ingredients with available ingredients
async function generateShoppingList(recipes: any[], availableIngredients: string[]): Promise<any[]> {
  // Normalize available ingredients (lowercase, trimmed)
  const normalizedAvailable = availableIngredients.map(ing => ing.toLowerCase().trim());
  
  // Extract all ingredients from recipes
  const neededIngredients = new Map();
  
  recipes.forEach(recipe => {
    if (recipe.extendedIngredients && Array.isArray(recipe.extendedIngredients)) {
      recipe.extendedIngredients.forEach((ingredient: any) => {
        // Only add if not in available ingredients
        const ingName = ingredient.name || ingredient.originalName || '';
        
        // Check if ingredient is available (simple string matching)
        const isAvailable = normalizedAvailable.some(available => 
          ingName.toLowerCase().includes(available) || available.includes(ingName.toLowerCase())
        );
        
        if (!isAvailable && ingName) {
          // Add or update ingredient in the map
          if (neededIngredients.has(ingName)) {
            const existing = neededIngredients.get(ingName);
            neededIngredients.set(ingName, {
              ...existing,
              amount: existing.amount + (ingredient.amount || 0),
              recipes: [...existing.recipes, recipe.title]
            });
          } else {
            neededIngredients.set(ingName, {
              name: ingName,
              amount: ingredient.amount || 0,
              unit: ingredient.unit || '',
              recipes: [recipe.title],
              aisle: ingredient.aisle || 'Unknown'
            });
          }
        }
      });
    }
  });
  
  // Convert map to array and sort by aisle for shopping convenience
  return Array.from(neededIngredients.values()).sort((a, b) => 
    a.aisle.localeCompare(b.aisle)
  );
}