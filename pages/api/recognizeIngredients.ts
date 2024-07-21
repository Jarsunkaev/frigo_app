import { IncomingForm } from 'formidable';
import type { NextApiRequest as NextReq, NextApiResponse } from 'next';
import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME } = process.env;

AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: 'eu-central-1',
});

const Rekognition = new AWS.Rekognition();
const S3 = new AWS.S3();

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
const imageKey = `uploads/${Date.now()}_${imageFile.originalFilename}`;  
await S3.putObject({
  Bucket: "myreciperecognitionbucket",
  Key: imageKey,
  Body: imageBuffer,
  ContentType: imageFile.mimetype,  
}).promise();
  
    try {
      const rekognitionResult = await Rekognition.detectLabels({
        Image: {
          S3Object: {
            Bucket: S3_BUCKET_NAME,
            Name: imageKey,
          },
        },
        MaxLabels: 10,
      }).promise();
  
      const ingredients = rekognitionResult.Labels?.map((label) => label.Name) || [];
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
  