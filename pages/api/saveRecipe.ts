// pages/api/saveRecipe.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../lib/firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';

type ResponseData = {
  success: boolean;
  message: string;
  recipeId?: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
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
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
    } else {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    // Extract recipe data and action from request body
    const { recipe, action } = req.body;
    
    if (!recipe || !recipe.id) {
      return res.status(400).json({ success: false, message: 'Invalid recipe data' });
    }
    
    // Reference to the recipe document
    const db = admin.firestore();
    const recipeRef = db.collection('users').doc(userId).collection('savedRecipes').doc(recipe.id.toString());
    
    if (action === 'remove') {
      // Remove recipe from saved recipes
      await recipeRef.delete();
      
      // Log the action
      await db.collection('userActivityLogs').add({
        userId: userId,
        action: 'recipe_removed',
        recipeId: recipe.id,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Update usage statistics - reduce the count if available
      const statsRef = db.collection('users').doc(userId).collection('usage').doc('statistics');
      const statsDoc = await statsRef.get();
      
      if (statsDoc.exists) {
        const totalRecipesSaved = statsDoc.data()?.totalRecipesSaved || 0;
        if (totalRecipesSaved > 0) {
          await statsRef.update({
            totalRecipesSaved: admin.firestore.FieldValue.increment(-1),
            lastUsageDate: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }
      
      return res.status(200).json({ 
        success: true, 
        message: 'Recipe removed successfully',
        recipeId: recipe.id
      });
    } else {
      // Format recipe data for storage
      const recipeData = {
        id: recipe.id,
        title: recipe.title || "Untitled Recipe",
        image: recipe.image || '',
        readyInMinutes: recipe.readyInMinutes || 30,
        servings: recipe.servings || 4,
        sourceUrl: recipe.sourceUrl || '',
        diets: recipe.diets || [],
        savedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      // Save recipe
      await recipeRef.set(recipeData);
      
      // Update usage statistics
      const statsRef = db.collection('users').doc(userId).collection('usage').doc('statistics');
      const statsDoc = await statsRef.get();
      
      if (statsDoc.exists) {
        await statsRef.update({
          totalRecipesSaved: admin.firestore.FieldValue.increment(1),
          lastUsageDate: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        await statsRef.set({
          totalRecipesSaved: 1,
          totalGenerations: 0,
          lastUsageDate: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      // Log the action
      await db.collection('userActivityLogs').add({
        userId: userId,
        action: 'recipe_saved',
        recipeId: recipe.id,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return res.status(200).json({ 
        success: true, 
        message: 'Recipe saved successfully',
        recipeId: recipe.id
      });
    }
  } catch (error) {
    console.error('Error in saveRecipe API:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred while processing the recipe' 
    });
  }
}