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

    const { ingredients, count } = req.body;

    if (!Array.isArray(ingredients) || !ingredients.every(item => typeof item === 'string')) {
        console.error('Invalid ingredients format. It must be an array of strings.');
        return res.status(400).json({ error: 'Invalid ingredients format. It must be an array of strings.' });
    }

    if (ingredients.length === 0) {
        console.error('No ingredients provided.');
        return res.status(400).json({ error: 'No ingredients provided.' });
    }

    if (typeof count !== 'number' || count <= 0 || count > 15) {
        console.error('Invalid recipe count.');
        return res.status(400).json({ error: 'Invalid recipe count. It must be a number between 1 and 15.' });
    }

    try {
        console.log('Ingredients:', ingredients);
        console.log('Recipe count:', count);
        console.log('API Key:', process.env.SPOONACULAR_API_KEY ? 'Set' : 'Not Set');

        const response = await axios.get<RecipeResponse[]>('https://api.spoonacular.com/recipes/findByIngredients', {
            params: {
                apiKey: process.env.SPOONACULAR_API_KEY,
                ingredients: ingredients.join(','),
                number: count,
            }
        });

        console.log('Spoonacular API Response:', response.data);

        res.status(200).json(response.data);
    } catch (error) {
        console.error('Error fetching recipes:', error);

        if (axios.isAxiosError(error)) {
            console.error('Axios error details:', error.response?.data);
            return res.status(error.response?.status || 500).json({
                error: 'Failed to fetch recipes.',
                details: error.response?.data || error.message
            });
        }

        res.status(500).json({ error: 'Failed to fetch recipes.', details: error.message });
    }
}