import { IncomingForm } from 'formidable';
import type { NextApiRequest as NextReq, NextApiResponse } from 'next';
import fs from 'fs';

const { OPENAI_API_KEY } = process.env;

export const config = {
  api: {
    bodyParser: false,
  },
};

interface UploadedFiles {
  image: {
    size: number;
    filepath: string;
    originalFilename: string;
    mimetype: string;
    lastModifiedDate: Date;
    newFilename: string;
  }[];
}

function cleanIngredient(ingredient: string): string {
  // Remove bullet points, numbers, and leading/trailing whitespace
  return ingredient.replace(/^[\s\-•]*([\d]+\.)?/, '').trim();
}

export default async function recognizeIngredients(req: NextReq, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  let data: UploadedFiles;
  try {
    data = await new Promise<UploadedFiles>((resolve, reject) => {
      const form = new IncomingForm();
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        console.log("Parsed Files:", files);
        resolve(files as unknown as UploadedFiles);
      });
    });
  } catch (error) {
    return res.status(400).json({ error: 'Error processing uploaded file.' });
  }

  const imageFile = data.image[0];

  if (!imageFile) {
    return res.status(400).json({ error: 'Image not correctly provided.' });
  }

  const imageBuffer = fs.readFileSync(imageFile.filepath);
  
  // Convert the image buffer to a base64 string
  const base64Image = imageBuffer.toString('base64');

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${OPENAI_API_KEY}`,
  };

  const payload = {
    "model": "gpt-4o-mini",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "What ingredients do you see in this image? List them on separate lines and don't add any additional information"
          },
          {
            "type": "image_url",
            "image_url": {
              "url": `data:image/jpeg;base64,${base64Image}`
            }
          }
        ]
      }
    ],
    "max_tokens": 300
  };

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const result = await response.json();
    const ingredientsRaw = result.choices[0]?.message?.content?.trim().split("\n") || [];
    const ingredients = ingredientsRaw.map(cleanIngredient).filter(Boolean);
    res.status(200).json(ingredients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to recognize ingredients.' });
  } finally {
    // Safely delete the uploaded file
    fs.unlink(imageFile.filepath, (err) => {
      if (err) console.error('Error deleting file:', err);
    });
  }
}