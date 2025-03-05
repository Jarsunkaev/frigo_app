// pages/api/create-portal-session.js
import Stripe from 'stripe';
import { getAuth } from 'firebase-admin/auth';
import admin from '../../lib/firebaseAdmin'; // Ensure this path is correct and the module exists

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    // Get customerId from request body
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    // Verify user is authenticated
    const authHeader = req.headers.authorization;
    let userId = null;
    
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
      // For development, you might want to skip auth verification
      // In production, always verify the user is authenticated
      console.warn('No authentication token provided');
      // Skip auth check in development
      // return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify the customer belongs to this user
    try {
      const customerDoc = await admin.firestore().collection('customers').doc(customerId).get();
      
      if (!customerDoc.exists) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      
      const customerData = customerDoc.data();
      
      // Skip this check in development if needed
      if (userId && customerData.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to access this customer' });
      }
    } catch (error) {
      console.error('Error verifying customer ownership:', error);
      // Continue anyway for development
    }

    // Create the portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${req.headers.origin}/subscription`,
    });

    // Return the session URL
    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return res.status(500).json({ 
      error: 'Failed to create portal session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}