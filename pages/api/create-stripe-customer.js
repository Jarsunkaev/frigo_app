// pages/api/create-stripe-customer.js
import Stripe from 'stripe';
import admin from '../../lib/firebaseAdmin';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-01-27.acacia',
});

export default async function handler(req, res) {
  // Enable CORS for development (adjust as needed)
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Log incoming request details
  console.log('Incoming create-stripe-customer request:', {
    body: {
      ...req.body,
      // Don't log sensitive data if present
      email: req.body.email ? '***@***.***' : undefined
    }
  });

  const { userId, email, source } = req.body;

  // Validate input
  if (!userId || !email) {
    console.error('Missing userId or email', { userId, email });
    return res.status(400).json({ error: 'User ID and email are required' });
  }

  try {
    // Check if user already exists in Firestore
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    if (userDoc.exists && userDoc.data().stripeCustomerId) {
      const existingCustomerId = userDoc.data().stripeCustomerId;
      console.log(`User ${userId} already has Stripe customer ID: ${existingCustomerId}`);
      
      // Verify the customer exists in Stripe
      try {
        const existingCustomer = await stripe.customers.retrieve(existingCustomerId);
        if (existingCustomer && !existingCustomer.deleted) {
          console.log('Using existing verified Stripe customer:', existingCustomerId);
          return res.status(200).json({ 
            customerId: existingCustomerId,
            message: 'Using existing Stripe customer',
            isNew: false
          });
        } else {
          console.log('Existing customer was deleted in Stripe, creating new one');
          // Continue to create a new customer
        }
      } catch (stripeError) {
        console.error('Error retrieving existing customer from Stripe:', stripeError);
        // Continue to create a new customer
      }
    }

    // Check if a customer already exists for this email in Stripe
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1
    });

    let customerId;
    let isNewCustomer = false;
    
    if (existingCustomers.data.length > 0) {
      // Use existing customer
      customerId = existingCustomers.data[0].id;
      console.log('Using existing Stripe customer with same email:', customerId);
      
      // Update customer metadata with this userId
      await stripe.customers.update(customerId, {
        metadata: { 
          userId: userId,
          source: source || 'api_link',
          updatedAt: new Date().toISOString()
        }
      });
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: email,
        metadata: { 
          userId: userId,
          source: source || 'api_create',
          createdAt: new Date().toISOString()
        }
      });
      customerId = customer.id;
      isNewCustomer = true;
      console.log('Created new Stripe customer:', customerId);
    }

    // Update Firestore with Stripe customer ID
    const db = admin.firestore();

    // Transaction to update both user and customer collections
    await db.runTransaction(async (transaction) => {
      // 1. Update users collection
      const userRef = db.collection('users').doc(userId);
      transaction.set(userRef, {
        stripeCustomerId: customerId,
        email: email,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      // 2. Create/update customer record
      const customerRef = db.collection('customers').doc(customerId);
      transaction.set(customerRef, {
        userId: userId,
        email: email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        source: source || 'api',
        isNewCustomer: isNewCustomer
      }, { merge: true });
    });

    console.log(`Successfully ${isNewCustomer ? 'created' : 'linked'} Stripe customer for user ${userId}`);

    // Create an audit log
    await db.collection('auditLogs').add({
      action: isNewCustomer ? 'stripe_customer_created' : 'stripe_customer_linked',
      userId: userId,
      customerId: customerId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      success: true,
      source: source || 'api',
      environment: process.env.NODE_ENV || 'development'
    });

    return res.status(200).json({ 
      customerId: customerId,
      message: isNewCustomer ? 'Stripe customer created successfully' : 'Existing Stripe customer linked successfully',
      isNew: isNewCustomer
    });

  } catch (error) {
    console.error('Error in Stripe customer creation:', error);
    
    // Create failure audit log
    try {
      await admin.firestore().collection('auditLogs').add({
        action: 'stripe_customer_creation_error',
        userId: userId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        success: false,
        source: source || 'api',
        error: error.message,
        environment: process.env.NODE_ENV || 'development'
      });
    } catch (logError) {
      console.error('Error creating audit log:', logError);
    }
    
    return res.status(500).json({ 
      error: 'Failed to create/retrieve Stripe customer',
      details: error.message 
    });
  }
}

// Enable body parsing
export const config = {
  api: {
    bodyParser: true
  }
};