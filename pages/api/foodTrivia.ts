import axios from 'axios';

export default async function handler(req: any, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { fact?: any; error?: string; }): void; new(): any; }; }; }) {
  try {
    const response = await axios.get('https://api.spoonacular.com/food/trivia/random', {
      params: {
        apiKey: process.env.SPOONACULAR_API_KEY 
      }
    });

    const fact = response.data.text;
    res.status(200).json({ fact });
  } catch (error) {
    console.error('Failed to fetch random food trivia:', error);
    res.status(500).json({ error: 'Failed to fetch random food trivia' });
  }
}
