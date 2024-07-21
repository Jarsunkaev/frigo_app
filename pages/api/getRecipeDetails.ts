import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

type RecipeDetails = {
  id: number;
  title: string;
  servings: number;
  readyInMinutes: number;
  image: string;
  instructions: string;
  sourceUrl: string;
};

export default async function getRecipeDetails(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).end(); // Return method not allowed if not a GET request
  }

  const recipeId = req.query.id as string;

  try {
    const response = await axios.get<RecipeDetails>(`https://api.spoonacular.com/recipes/${recipeId}/information`, {
      params: {
        apiKey: process.env.SPOONACULAR_API_KEY,
        includeNutrition: false, // We don't need nutritional information
      }
    });

    // Extract only the fields we need
    const {
      id,
      title,
      servings,
      readyInMinutes,
      image,
      instructions,
      sourceUrl
    } = response.data;

    // Return the extracted data
    res.status(200).json({
      id,
      title,
      servings,
      readyInMinutes,
      image,
      instructions,
      sourceUrl
    });
  } catch (error) {
    console.error('Error fetching recipe details:', error);
    res.status(500).json({ error: 'Failed to fetch recipe details.' });
  }
}