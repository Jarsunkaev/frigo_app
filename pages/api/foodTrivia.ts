import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

interface TriviaResponse {
  text: string;
}

type SuccessResponse = {
  fact: string;
};

type ErrorResponse = {
  error: string;
  details?: unknown;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Please use GET.' });
  }

  if (!process.env.SPOONACULAR_API_KEY) {
    console.error('SPOONACULAR_API_KEY is not defined');
    return res.status(500).json({ 
      error: 'Server configuration error. Please contact support.' 
    });
  }

  try {
    const queryParams = new URLSearchParams({
      apiKey: process.env.SPOONACULAR_API_KEY
    });

    const response = await axios.get<TriviaResponse>(
      `https://api.spoonacular.com/food/trivia/random?${queryParams.toString()}`,
      { 
        timeout: 5000,  // 5 second timeout
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    if (!response.data.text) {
      throw new Error('Invalid response format from Spoonacular API');
    }

    // Clean and format the trivia text
    const fact = response.data.text
      .trim()
      .replace(/\s+/g, ' ')  // Remove extra whitespace
      .replace(/[""]/g, '"') // Normalize quotes
      .replace(/\.+$/, '.'); // Normalize ending punctuation

    // Cache the response for 1 hour
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    
    return res.status(200).json({ fact });

  } catch (error) {
    console.error('Food trivia error:', error);

    if (axios.isAxiosError(error)) {
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
        error: 'Failed to fetch food trivia from external service.',
        details: error.response?.data
      });
    }

    return res.status(500).json({ 
      error: 'An unexpected error occurred. Please try again.' 
    });
  }
}