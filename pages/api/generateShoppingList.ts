// pages/api/generateShoppingList.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { getAuth } from 'firebase-admin/auth';
import admin from '../../lib/firebaseAdmin';

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

    // Extract request parameters
    const { 
      startDate,
      endDate,
      recipeIds
    } = req.body;
    
    if (!recipeIds || !Array.isArray(recipeIds) || recipeIds.length === 0) {
      return res.status(400).json({ error: 'Recipe IDs are required' });
    }
    
    // First, fetch the recipe information for the provided recipe IDs
    try {
      const response = await axios.get(
        `https://api.spoonacular.com/recipes/informationBulk?ids=${recipeIds.join(',')}&apiKey=${process.env.SPOONACULAR_API_KEY}`,
        { timeout: 10000 }
      );

      // Extract ingredients from the recipes
      const ingredients = [];
      response.data.forEach((recipe: any) => {
        if (recipe.extendedIngredients && Array.isArray(recipe.extendedIngredients)) {
          recipe.extendedIngredients.forEach((ingredient: any) => {
            ingredients.push({
              name: ingredient.name,
              amount: ingredient.amount,
              unit: ingredient.unit,
              originalString: ingredient.original
            });
          });
        }
      });

      // Consolidate ingredients (combine duplicates)
      const consolidatedIngredients: Record<string, any> = {};
      ingredients.forEach((ingredient) => {
        const key = ingredient.name.toLowerCase();
        if (consolidatedIngredients[key]) {
          consolidatedIngredients[key].amount += ingredient.amount;
        } else {
          consolidatedIngredients[key] = {
            ...ingredient,
          };
        }
      });

      // Convert to array and sort alphabetically
      const sortedIngredients = Object.values(consolidatedIngredients).sort((a, b) => 
        a.name.localeCompare(b.name)
      );

      // Store in Firestore for history/reference
      const shoppingListRef = admin.firestore().collection('users').doc(userId).collection('shoppingLists');
      await shoppingListRef.add({
        ingredients: sortedIngredients,
        recipes: recipeIds,
        startDate,
        endDate,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.status(200).json({
        success: true,
        shoppingList: sortedIngredients
      });
    } catch (error) {
      console.error('Error generating shopping list:', error);
      return res.status(500).json({ error: 'Failed to generate shopping list' });
    }
  } catch (error: any) {
    console.error('Error in shopping list API:', error);
    return res.status(500).json({ 
      error: 'An unexpected error occurred. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}