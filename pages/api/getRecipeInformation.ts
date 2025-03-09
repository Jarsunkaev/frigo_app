// pages/api/getRecipeInformation.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { getAuth } from 'firebase-admin/auth';

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
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
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

    // Extract IDs from query
    const { ids } = req.query;
    
    if (!ids) {
      return res.status(400).json({ error: 'Recipe IDs are required' });
    }
    
    // Make request to Spoonacular API
    const response = await axios.get(
      `https://api.spoonacular.com/recipes/informationBulk?ids=${ids}&apiKey=${process.env.SPOONACULAR_API_KEY}`,
      { 
        timeout: 10000,
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.data || !Array.isArray(response.data)) {
      return res.status(500).json({ error: 'Invalid response from recipe service' });
    }
    
    // Return the recipe data
    return res.status(200).json(response.data);
    
  } catch (error: any) {
    console.error('Error fetching recipe information:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 402 || error.response?.status === 429) {
        return res.status(429).json({ 
          error: 'API rate limit exceeded. Please try again later.' 
        });
      }
      
      return res.status(error.response?.status || 500).json({
        error: 'Failed to fetch recipe information',
        details: error.response?.data || error.message
      });
    }
    
    return res.status(500).json({ 
      error: 'An unexpected error occurred. Please try again.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}