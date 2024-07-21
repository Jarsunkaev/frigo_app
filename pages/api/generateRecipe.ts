import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

type RecipeResponse = {
  id: number;
  title: string;
};

export default async function generateRecipe(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).end();
    }

    const ingredients: string[] = req.body.ingredients;
    if (!ingredients || ingredients.length === 0) {
        return res.status(400).json({ error: 'No ingredients provided.' });
    }

    try {
        const response = await axios.get<RecipeResponse[]>('https://api.spoonacular.com/recipes/findByIngredients', {
            params: {
                apiKey: process.env.SPOONACULAR_API_KEY,
                ingredients: ingredients.join(','),
                number: 5, 
            }
        });

        res.status(200).json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch recipes.' });
    }
}
