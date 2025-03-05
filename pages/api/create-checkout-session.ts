// pages/api/create-checkout-session.ts
import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import admin from '../../lib/firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set CORS headers if needed
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Please use POST.' });
  }

  try {
    // Extract authorization token if present
    const authHeader = req.headers.authorization;
    let userId = null;
    
    // Verify the authentication token if provided
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      try {
        const decodedToken = await getAuth().verifyIdToken(idToken);
        userId = decodedToken.uid;
        console.log(`Authenticated request for user: ${userId}`);
      } catch (authError) {
        console.error('Error verifying authentication token:', authError);
        // Continue with the userId from the body if token verification fails
      }
    }

    // Extract data from request body
    const { userId: bodyUserId, email, name } = req.body;
    
    // Use authenticated userId if available, otherwise use the one from the request body
    const finalUserId = userId || bodyUserId;
    
    // Validate required parameters
    if (!finalUserId) {
      return res.status(400).json({ error: 'Missing required parameter: userId' });
    }
    
    console.log(`Creating checkout session for user: ${finalUserId}, email: ${email || 'not provided'}`);

    // Retrieve user document to verify it exists
    let userDoc;
    try {
      userDoc = await admin.firestore().collection('users').doc(finalUserId).get();
      
      if (!userDoc.exists) {
        console.log(`User document doesn't exist, creating one for ${finalUserId}`);
        // Create a basic user document if it doesn't exist
        await admin.firestore().collection('users').doc(finalUserId).set({
          email: email || '',
          displayName: name || '',
          subscriptionTier: 'free',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        userDoc = await admin.firestore().collection('users').doc(finalUserId).get();
      }
    } catch (dbError) {
      console.error('Error accessing user document:', dbError);
      return res.status(500).json({ 
        error: 'Database error while accessing user record',
        details: dbError instanceof Error ? dbError.message : 'Unknown error'
      });
    }

    // Handle Stripe customer creation or retrieval
    let customerId: string;
    
    // Check if user already has a Stripe customer ID
    if (userDoc.exists && userDoc.data()?.stripeCustomerId) {
      customerId = userDoc.data()?.stripeCustomerId;
      console.log(`Using existing Stripe customer: ${customerId}`);
      
      // Verify the customer still exists in Stripe
      try {
        await stripe.customers.retrieve(customerId);
      } catch (stripeError) {
        console.warn(`Existing customer ID ${customerId} not found in Stripe, will create new one`);
        customerId = '';  // Reset to create a new one
      }
    }
    
    // If no customer ID found, create a new one
    if (!customerId) {
      // Look for existing customer by email first
      if (email) {
        const existingCustomers = await stripe.customers.list({
          email: email,
          limit: 1
        });

        if (existingCustomers.data.length > 0) {
          const customer = existingCustomers.data[0];
          customerId = customer.id;
          console.log(`Found existing customer by email: ${customerId}`);
          
          // Update customer metadata with userId
          await stripe.customers.update(customerId, {
            metadata: {
              userId: finalUserId,
              updatedAt: new Date().toISOString()
            },
          });
        } else {
          // Create new customer
          const newCustomer = await stripe.customers.create({
            email: email,
            name: name,
            metadata: {
              userId: finalUserId,
              createdAt: new Date().toISOString()
            },
          });
          customerId = newCustomer.id;
          console.log(`Created new Stripe customer: ${customerId}`);
        }
        
        // Update user document with customer ID
        await admin.firestore().collection('users').doc(finalUserId).set({
          stripeCustomerId: customerId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        // Create or update customer document in Firestore
        await admin.firestore().collection('customers').doc(customerId).set({
          userId: finalUserId,
          email: email,
          name: name,
          created: admin.firestore.FieldValue.serverTimestamp(),
          updated: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } else {
        return res.status(400).json({ error: 'Email is required to create a new customer' });
      }
    }

    // Set success and cancel URLs
    const origin = req.headers.origin || process.env.NEXT_PUBLIC_BASE_URL || 'https://frigo-app.com';
    const successUrl = `${origin}/subscription?status=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/subscription?status=cancel`;

    // Get price ID from environment, with fallback
    const priceId = process.env.STRIPE_PREMIUM_PRICE_ID;
    if (!priceId) {
      console.error('STRIPE_PREMIUM_PRICE_ID environment variable is not set');
      return res.status(500).json({ error: 'Missing price configuration. Please contact support.' });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: finalUserId,
      },
      client_reference_id: finalUserId, // CRITICAL: This is used to identify the user in webhooks
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: {
          userId: finalUserId, // Add metadata to the subscription too
        },
      },
    });

    // Create a detailed audit log
    try {
      await admin.firestore().collection('checkoutLogs').add({
        userId: finalUserId,
        email: email,
        sessionId: session.id,
        customerId: customerId,
        environment: process.env.NODE_ENV || 'production',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        userAgent: req.headers['user-agent'],
        ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress
      });
    } catch (logError) {
      console.error('Error creating checkout log:', logError);
      // Continue even if logging fails
    }

    return res.status(200).json({ 
      sessionId: session.id, 
      url: session.url,
      customerId: customerId
    });
    
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ 
      error: 'Error creating checkout session',
      details: error.message 
    });
  }
}