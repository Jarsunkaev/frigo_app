// pages/api/generateRecipe.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { checkAndUpdateGenerationLimit } from '../../utils/recipe-limits';
import admin from '../../lib/firebaseAdmin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('generateRecipe API called with method:', req.method);

  // Add more permissive CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    console.log('Request body:', req.body);
    const { ingredients, userId } = req.body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      console.log('Invalid ingredients:', ingredients);
      return res.status(400).json({ error: 'Valid ingredients array is required' });
    }
    if (!userId) {
      console.log('Missing userId');
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Add more debug logs
    console.log('Environment check:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- SPOONACULAR_API_KEY exists:', !!process.env.SPOONACULAR_API_KEY);
    
    // Check and update the generation limit
    console.log('Checking generation limit for user:', userId);
    const canGenerate = await checkAndUpdateGenerationLimit(userId);
    if (!canGenerate) {
      console.log('User reached daily generation limit:', userId);
      return res.status(429).json({ error: 'Daily generation limit reached. Please try again tomorrow or upgrade your plan.' });
    }
    console.log('User has remaining generations:', userId);

    // Check if the user is premium or free
    const userRef = admin.firestore().collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.log('User document not found');
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Print user document data for debugging
    console.log('User document data:', userDoc.data());
    
    const userData = userDoc.data();
    const isPremium = userData.subscriptionTier === 'premium';
    
    // Set the number of recipes based on subscription tier
    const numberOfRecipes = isPremium ? '25' : '25'; // Get all 25 recipes but mark some as premium-only
    console.log(`User is ${isPremium ? 'premium' : 'free'}, fetching ${numberOfRecipes} recipes`);

    const cleanedIngredients = ingredients.map((i: string) => i.trim().toLowerCase()).join(',');

    if (!process.env.SPOONACULAR_API_KEY) {
      console.error('SPOONACULAR_API_KEY not set in environment variables');
      return res.status(500).json({ error: 'Server configuration error. API key not set.' });
    }

    const queryParams = new URLSearchParams({
      apiKey: process.env.SPOONACULAR_API_KEY,
      ingredients: cleanedIngredients,
      number: numberOfRecipes,
      ranking: '2',
      ignorePantry: 'true'
    });

    console.log('Making request to Spoonacular API with ingredients:', cleanedIngredients);
    console.log('Request URL:', `https://api.spoonacular.com/recipes/findByIngredients?${queryParams.toString().replace(/apiKey=([^&]+)/, 'apiKey=HIDDEN')}`);
    
    const response = await axios.get(
      `https://api.spoonacular.com/recipes/findByIngredients?${queryParams.toString()}`,
      { 
        timeout: 15000, // Increased timeout for more recipes
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Spoonacular API response status:', response.status);
    
    // Add more detailed logging for the response
    if (!response.data) {
      console.error('Empty response from Spoonacular API');
      return res.status(500).json({ error: 'Empty response from recipe service' });
    }
    
    if (!Array.isArray(response.data)) {
      console.error('Invalid response format from Spoonacular API:', typeof response.data);
      console.error('Response preview:', JSON.stringify(response.data).substring(0, 200));
      return res.status(500).json({ error: 'Invalid response format from recipe service' });
    }

    // For free users, mark recipes beyond the first 6 as premium only
    let processedRecipes = response.data;
    if (!isPremium && processedRecipes.length > 6) {
      processedRecipes = processedRecipes.map((recipe, index) => ({
        ...recipe,
        isPremiumOnly: index >= 6
      }));
    }

    console.log(`Found ${processedRecipes.length} recipes from Spoonacular API`);
    
    // Log recipe generation for analytics
    try {
      await admin.firestore().collection('recipeGenerationLogs').add({
        userId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        ingredientsCount: ingredients.length,
        recipesCount: processedRecipes.length,
        recipesShown: isPremium ? processedRecipes.length : Math.min(processedRecipes.length, 6),
        subscriptionTier: isPremium ? 'premium' : 'free'
      });
      console.log('Successfully created recipe generation log');
    } catch (logError) {
      console.error('Error logging recipe generation:', logError);
      // Don't fail the request if logging fails
    }
    
    // Double-check that the counter was actually incremented and force an update timestamp
    try {
      // Get the latest user document to verify the counter update
      const latestUserDoc = await userRef.get();
      
      if (latestUserDoc.exists) {
        const latestUserData = latestUserDoc.data();
        console.log(`GENERATION COMPLETE - User ${userId} daily count is now: ${latestUserData.dailyGenerations}`);
        
        // Force a timestamp update to trigger listeners
        await userRef.update({
          lastUpdateTimestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Log updated user data for debugging
        const verifyUserDoc = await userRef.get();
        const verifyUserData = verifyUserDoc.data();
        console.log(`VERIFIED: User ${userId} daily generations confirmed as: ${verifyUserData.dailyGenerations}`);
      }
    } catch (verifyError) {
      console.error('Error verifying generation count update:', verifyError);
      // Continue anyway, don't fail the request
    }
    
    return res.status(200).json(processedRecipes);
  } catch (error: any) {
    console.error('Unexpected error in generateRecipe API:', error);
    
    // More detailed error logging
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:');
      console.error('- Status:', error.response?.status);
      console.error('- Status text:', error.response?.statusText);
      console.error('- Response data:', error.response?.data);
      console.error('- Request URL:', error.config?.url);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        return res.status(error.response.status).json({ 
          error: 'API authentication error. Check your API key.',
          details: error.response.data
        });
      }
      
      if (error.response?.status === 429) {
        return res.status(429).json({ 
          error: 'Rate limit exceeded on recipe service. Please try again later.',
          details: error.response.data
        });
      }
    }
    
    return res.status(500).json({ 
      error: 'An unexpected error occurred. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}