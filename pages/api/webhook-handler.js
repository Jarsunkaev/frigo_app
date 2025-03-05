// pages/api/webhook-handler.js
import Stripe from 'stripe';
import getRawBody from 'raw-body';
import admin from '../../lib/firebaseAdmin';

// Disable Next.js body parsing - we need the raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

const webhookHandler = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  // Get the webhook secret from environment variables
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.error('Webhook secret missing from environment variables');
    return res.status(500).json({ error: 'Webhook secret missing' });
  }

  // Initialize Stripe
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-01-27.acacia',
  });

  try {
    // Read the raw request body
    const rawBody = await getRawBody(req);
    
    // Get Stripe signature from headers
    const signature = req.headers['stripe-signature'];
    
    if (!signature) {
      console.error('No Stripe signature found in headers');
      return res.status(400).json({ error: 'No Stripe signature in headers' });
    }
    
    // Verify signature and construct event
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );

    console.log(`Event verified: ${event.type}, ID: ${event.id}`);
    
    // Log raw event to a special collection for debugging
    try {
      await admin.firestore()
        .collection('rawWebhookEvents')
        .doc(event.id)
        .set({
          eventType: event.type,
          eventData: JSON.parse(JSON.stringify(event.data.object)),
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          processed: false
        });
    } catch (logError) {
      console.error(`Failed to log raw webhook event: ${logError.message}`);
      // Continue processing even if logging fails
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object, stripe);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object, stripe);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, stripe);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, stripe);
        break;
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object, stripe);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object, stripe);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    // Force direct update regardless of event handling success
    await forceUpdateUserSubscription(event, stripe);

    // Return success response
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }
};

// Direct and robust subscription update function
async function forceUpdateUserSubscription(event, stripe) {
  // Extract relevant data based on event type
  let userId = null;
  let customerId = null;
  let subscriptionId = null;
  let subscriptionStatus = null;
  
  console.log(`Processing event ${event.type} for forced update`);
  
  try {
    const eventData = event.data.object;
    
    // Get user ID from several possible sources
    userId = eventData.client_reference_id || 
             (eventData.metadata && eventData.metadata.userId) ||
             null;
             
    // Get customer ID
    customerId = eventData.customer || null;
    
    // If we don't have userId directly but have customerId, look it up
    if (!userId && customerId) {
      console.log(`Looking up user by customer ID: ${customerId}`);
      try {
        // First try to find in customers collection
        const customerDoc = await admin.firestore()
          .collection('customers')
          .doc(customerId)
          .get();
          
        if (customerDoc.exists && customerDoc.data().userId) {
          userId = customerDoc.data().userId;
          console.log(`Found userId ${userId} for customer ${customerId}`);
        } else {
          // If not in customers collection, try users collection
          const usersSnapshot = await admin.firestore()
            .collection('users')
            .where('stripeCustomerId', '==', customerId)
            .limit(1)
            .get();
            
          if (!usersSnapshot.empty) {
            userId = usersSnapshot.docs[0].id;
            console.log(`Found userId ${userId} by stripeCustomerId lookup`);
          }
        }
      } catch (lookupError) {
        console.error(`Error looking up user by customer ID: ${lookupError.message}`);
      }
    }
    
    // Get subscription info if available
    subscriptionId = eventData.subscription || 
                    (eventData.id && event.type.includes('subscription') ? eventData.id : null);
                    
    subscriptionStatus = eventData.status || 'active';
    
    // If we still don't have a userId and this is a checkout session, try metadata lookup
    if (!userId && event.type === 'checkout.session.completed') {
      console.log(`Attempting to get userId from checkout metadata`);
      // Try to get subscription from checkout session
      if (subscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          if (subscription.metadata && subscription.metadata.userId) {
            userId = subscription.metadata.userId;
            console.log(`Found userId ${userId} from subscription metadata`);
          }
        } catch (subError) {
          console.error(`Error retrieving subscription: ${subError.message}`);
        }
      }
    }
    
    // Log what we found
    console.log(`Extracted data: userId=${userId}, customerId=${customerId}, subId=${subscriptionId}, status=${subscriptionStatus}`);
    
    // If we don't have a userId, we can't proceed
    if (!userId) {
      console.error('No user ID found in event data, cannot update subscription');
      
      // Log to a special collection for manual investigation
      await admin.firestore()
        .collection('unidentifiedWebhookEvents')
        .add({
          eventId: event.id,
          eventType: event.type,
          eventData: JSON.parse(JSON.stringify(event.data.object)),
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          error: 'No user ID found in event data'
        });
        
      return false;
    }
    
    // Now update the user document - direct and simple
    console.log(`Forcing subscription update for user ${userId}`);
    const userRef = admin.firestore().collection('users').doc(userId);
    
    const subscriptionUpdate = {
      subscriptionTier: 'premium',
      subscriptionStatus: subscriptionStatus || 'active',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedByWebhook: true,
      updatedByWebhookEvent: event.type,
      updatedByWebhookId: event.id
    };
    
    if (subscriptionId) {
      subscriptionUpdate.subscriptionId = subscriptionId;
    }
    
    if (customerId) {
      subscriptionUpdate.stripeCustomerId = customerId;
    }
    
    // Use set with merge:true to ensure we don't overwrite other fields
    await userRef.set(subscriptionUpdate, { merge: true });
    
    // Read back to verify update
    const updatedDoc = await userRef.get();
    console.log(`Verified update: tier=${updatedDoc.data().subscriptionTier}, status=${updatedDoc.data().subscriptionStatus}`);
    
    // Update webhook event as processed
    await admin.firestore()
      .collection('rawWebhookEvents')
      .doc(event.id)
      .update({ 
        processed: true,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        processedUserId: userId
      });
      
    return true;
  } catch (error) {
    console.error(`Error in forceUpdateUserSubscription: ${error.message}`);
    console.error(error.stack);
    
    // Log error to audit log
    try {
      await admin.firestore()
        .collection('subscriptionUpdateErrors')
        .add({
          eventId: event.id,
          eventType: event.type,
          error: error.message,
          stack: error.stack,
          userId: userId,
          customerId: customerId,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
    } catch (logError) {
      console.error(`Error logging update error: ${logError.message}`);
    }
    
    return false;
  }
}

// Handle invoice.paid event
async function handleInvoicePaid(invoice, stripe) {
  try {
    console.log(`Processing invoice.paid: ${invoice.id}`);
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;
    
    if (!customerId) {
      console.error('Missing customer ID in invoice.paid event');
      return;
    }

    // Find customer - first in customers collection, then in users collection
    let userId = await findUserIdByCustomerId(customerId, stripe);
    
    if (!userId) {
      console.error(`Could not find user for Stripe customer: ${customerId}`);
      return;
    }
    
    // Update user subscription details
    try {
      const userRef = admin.firestore().collection('users').doc(userId);
      
      // Check if user document exists
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        console.error(`User document ${userId} does not exist, cannot update`);
        return;
      }
      
      // Update subscription data
      const updateData = {
        subscriptionTier: 'premium',
        subscriptionStatus: 'active',
        subscriptionId: subscriptionId,
        lastPaymentStatus: 'succeeded',
        lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        dailyGenerations: 0,
        lastResetDate: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await userRef.set(updateData, { merge: true });
      
      console.log(`Processed invoice.paid for user ${userId}`);
    } catch (error) {
      console.error(`Error updating user document: ${error.message}`);
    }
  } catch (error) {
    console.error(`Error handling invoice.paid: ${error.message}`);
  }
}

// Handle checkout.session.completed event
async function handleCheckoutSessionCompleted(session, stripe) {
  try {
    console.log(`Processing checkout session: ${session.id}`);
    
    // Get the user ID from client_reference_id
    const userId = session.client_reference_id;
    const customerId = session.customer;
    const customerEmail = session.customer_email || session.customer_details?.email;
    
    if (!userId) {
      console.error('Missing userId (client_reference_id) in session');
      return;
    }
    
    if (!customerId) {
      console.error('Missing customerId in session');
      return;
    }
    
    console.log(`Processing payment for user ${userId}`);

    // Update user document
    try {
      const userRef = admin.firestore().collection('users').doc(userId);
      const userDoc = await userRef.get();
  
      // Update user with subscription info
      const updateData = {
        email: customerEmail || '',
        stripeCustomerId: customerId,
        subscriptionTier: 'premium',
        subscriptionStatus: 'active',
        subscriptionId: session.subscription || null,
        dailyGenerations: 0,
        lastResetDate: new Date().toISOString(),
        createdAt: userDoc.exists ? userDoc.data().createdAt : admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await userRef.set(updateData, { merge: true });
    } catch (firestoreError) {
      console.error(`Firestore error updating user document:`, firestoreError);
    }

    // Create/update customer document
    try {
      await admin.firestore().collection('customers').doc(customerId).set({
        userId: userId,
        email: customerEmail || '',
        created: admin.firestore.FieldValue.serverTimestamp(),
        updated: admin.firestore.FieldValue.serverTimestamp(),
        sessionId: session.id,
        subscriptionId: session.subscription || null
      }, { merge: true });
    } catch (customerError) {
      console.error(`Error updating customer document:`, customerError);
    }

    console.log(`Linked user ${userId} to customer ${customerId}`);
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

// Handle customer.subscription.created event
async function handleSubscriptionCreated(subscription, stripe) {
  try {
    const customerId = subscription.customer;
    
    if (typeof customerId !== 'string' || !customerId) {
      console.error('Invalid or missing customerId in subscription');
      return;
    }
    
    console.log(`Processing subscription created: ${subscription.id}`);

    // Find the userId
    let userId = await findUserIdByCustomerId(customerId, stripe);
    
    if (!userId) {
      console.error(`No user found for customer ${customerId}`);
      return;
    }
    
    // Update user with subscription info
    const updateData = {
      subscriptionTier: 'premium',
      subscriptionStatus: subscription.status,
      subscriptionId: subscription.id,
      dailyGenerations: 0,
      lastResetDate: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const userRef = admin.firestore().collection('users').doc(userId);
    await userRef.set(updateData, { merge: true });
    
    // Update customer document
    await admin.firestore()
      .collection('customers')
      .doc(customerId)
      .set({
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        updated: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    
    console.log(`Updated user ${userId} to premium tier`);
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

// Handle customer.subscription.updated event
async function handleSubscriptionUpdated(subscription, stripe) {
  try {
    const customerId = subscription.customer;
    
    if (typeof customerId !== 'string' || !customerId) {
      console.error('Invalid or missing customerId in subscription update');
      return;
    }
    
    console.log(`Processing subscription updated: ${subscription.id}, status: ${subscription.status}`);

    // Find the userId
    const userId = await findUserIdByCustomerId(customerId, stripe);
    
    if (!userId) {
      console.error(`No user found for customer ${customerId}`);
      return;
    }
    
    // Determine subscription status and tier
    const updateData = {
      subscriptionStatus: subscription.status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // If subscription is no longer active, downgrade the tier
    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      updateData.subscriptionTier = 'free';
    } else {
      updateData.subscriptionTier = 'premium';
    }
    
    // Update user
    const userRef = admin.firestore().collection('users').doc(userId);
    await userRef.set(updateData, { merge: true });
    
    console.log(`Updated subscription for user ${userId}`);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

// Handle customer.subscription.deleted event
async function handleSubscriptionDeleted(subscription, stripe) {
  try {
    const customerId = subscription.customer;
    
    if (typeof customerId !== 'string' || !customerId) {
      console.error('Invalid or missing customerId in subscription deletion');
      return;
    }
    
    console.log(`Processing subscription deleted: ${subscription.id}`);

    // Find the userId
    const userId = await findUserIdByCustomerId(customerId, stripe);
    
    if (!userId) {
      console.error(`No user found for customer ${customerId}`);
      return;
    }
    
    // Downgrade user to free tier
    const updateData = {
      subscriptionTier: 'free',
      subscriptionStatus: 'cancelled',
      subscriptionId: null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Update user
    const userRef = admin.firestore().collection('users').doc(userId);
    await userRef.set(updateData, { merge: true });
    
    console.log(`Downgraded user ${userId} to free tier`);
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

// Handle invoice.payment_failed event
async function handleInvoicePaymentFailed(invoice, stripe) {
  try {
    console.log(`Processing invoice.payment_failed: ${invoice.id}`);
    const customerId = invoice.customer;
    
    if (!customerId) {
      console.error('Missing customer ID in invoice.payment_failed event');
      return;
    }
    
    // Find the userId
    const userId = await findUserIdByCustomerId(customerId, stripe);
    
    if (!userId) {
      console.error(`Could not find user for Stripe customer: ${customerId}`);
      return;
    }
    
    // Update user payment status
    const userRef = admin.firestore().collection('users').doc(userId);
    
    await userRef.set({
      lastPaymentStatus: 'failed',
      lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log(`Processed invoice.payment_failed for user ${userId}`);
  } catch (error) {
    console.error(`Error handling invoice.payment_failed: ${error.message}`);
  }
}

// Helper function to find userId by customerId
async function findUserIdByCustomerId(customerId, stripe) {
  // First check customers collection
  const customerSnapshot = await admin.firestore()
    .collection('customers')
    .doc(customerId)
    .get();
  
  if (customerSnapshot.exists) {
    return customerSnapshot.data().userId;
  }
  
  // Then check users collection
  const usersSnapshot = await admin.firestore()
    .collection('users')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();
  
  if (!usersSnapshot.empty) {
    const userId = usersSnapshot.docs[0].id;
    
    // Create missing customer document
    await admin.firestore()
      .collection('customers')
      .doc(customerId)
      .set({
        userId: userId,
        created: admin.firestore.FieldValue.serverTimestamp()
      });
    
    return userId;
  }
  
  // Last resort: try to find by email
  try {
    const stripeCustomer = await stripe.customers.retrieve(customerId);
    
    if (stripeCustomer && stripeCustomer.email) {
      const usersByEmailSnapshot = await admin.firestore()
        .collection('users')
        .where('email', '==', stripeCustomer.email)
        .limit(1)
        .get();
      
      if (!usersByEmailSnapshot.empty) {
        const userId = usersByEmailSnapshot.docs[0].id;
        
        // Update user with customerId
        await admin.firestore()
          .collection('users')
          .doc(userId)
          .set({
            stripeCustomerId: customerId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        
        // Create customer document
        await admin.firestore()
          .collection('customers')
          .doc(customerId)
          .set({
            userId: userId,
            email: stripeCustomer.email,
            created: admin.firestore.FieldValue.serverTimestamp()
          });
        
        return userId;
      }
    }
  } catch (error) {
    console.error(`Error retrieving customer from Stripe:`, error);
  }
  
  return null;
}

export default webhookHandler;