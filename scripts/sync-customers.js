// scripts/fix-user-subscriptions.js
require('dotenv').config();

const admin = require('firebase-admin');
const Stripe = require('stripe');

// Validate Stripe secret key
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('ERROR: STRIPE_SECRET_KEY is not set in .env file');
  process.exit(1);
}

// Initialize Stripe with the secret key
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Ensure you've set the path to your service account key
const serviceAccountPath = './service-account-key.json';

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath))
});

const db = admin.firestore();

/**
 * This script fixes user subscription plans by:
 * 1. Scanning through all Stripe customers
 * 2. Finding corresponding user documents
 * 3. Checking and updating the subscription tier based on active subscriptions
 * 4. Creating missing links between users and customers
 * 5. Creating missing customer documents
 */
async function fixUserSubscriptions() {
  try {
    console.log('Starting user subscriptions fix...');
    let customerCount = 0;
    let userUpdatedCount = 0;
    let customerDocCreatedCount = 0;
    let subscriptionFixedCount = 0;
    let issues = [];

    // Get all customers from Stripe
    let hasMore = true;
    let startingAfter = null;
    
    while (hasMore) {
      const options = {
        limit: 100, // Max limit per page
        expand: ['data.subscriptions'], // Expand subscriptions data
        ...(startingAfter && { starting_after: startingAfter })
      };
      
      // Fetch a batch of customers
      const stripeCustomers = await stripe.customers.list(options);
      
      console.log(`Processing batch of ${stripeCustomers.data.length} customers...`);
      
      // Process each customer
      for (const customer of stripeCustomers.data) {
        customerCount++;
        
        console.log(`Processing customer ${customer.id} (${customerCount})`);
        
        // Check if this customer has a document in the customers collection
        const customerRef = db.collection('customers').doc(customer.id);
        const customerDoc = await customerRef.get();
        
        // Find userId - from customers collection or metadata
        let userId = customerDoc.exists ? customerDoc.data().userId : null;
        
        // If not found in customers collection, check metadata
        if (!userId && customer.metadata && customer.metadata.userId) {
          userId = customer.metadata.userId;
          console.log(`Found userId ${userId} in customer metadata`);
        }
        
        // If still no userId, try to find by email
        if (!userId && customer.email) {
          try {
            const usersSnapshot = await db.collection('users')
              .where('email', '==', customer.email)
              .limit(1)
              .get();
            
            if (!usersSnapshot.empty) {
              userId = usersSnapshot.docs[0].id;
              console.log(`Found userId ${userId} by email: ${customer.email}`);
            }
          } catch (error) {
            console.error(`Error searching for user by email: ${error.message}`);
            issues.push({
              type: 'user_search_error',
              customerId: customer.id,
              email: customer.email,
              error: error.message
            });
          }
        }
        
        // If we couldn't find a user by any method, log the issue and continue
        if (!userId) {
          console.warn(`No user found for Stripe customer: ${customer.id}, email: ${customer.email || 'none'}`);
          issues.push({
            type: 'no_user_found',
            customerId: customer.id,
            email: customer.email || 'none'
          });
          continue;
        }
        
        // Now we have a userId, check user document
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
          console.warn(`User document not found: ${userId}`);
          issues.push({
            type: 'user_document_not_found',
            userId,
            customerId: customer.id
          });
          continue;
        }
        
        const userData = userDoc.data();
        
        // Create missing customer document if needed
        if (!customerDoc.exists) {
          try {
            await customerRef.set({
              userId,
              email: customer.email,
              created: admin.firestore.FieldValue.serverTimestamp(),
              lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            });
            customerDocCreatedCount++;
            console.log(`Created missing customer document for ${customer.id}`);
          } catch (error) {
            console.error(`Error creating customer document: ${error.message}`);
            issues.push({
              type: 'customer_doc_creation_failed',
              customerId: customer.id,
              userId,
              error: error.message
            });
          }
        }
        
        // Update user document with stripeCustomerId if missing
        if (!userData.stripeCustomerId || userData.stripeCustomerId !== customer.id) {
          try {
            await userRef.update({
              stripeCustomerId: customer.id,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            userUpdatedCount++;
            console.log(`Updated user ${userId} with stripeCustomerId: ${customer.id}`);
          } catch (error) {
            console.error(`Error updating user with stripeCustomerId: ${error.message}`);
            issues.push({
              type: 'user_update_failed',
              userId,
              customerId: customer.id,
              error: error.message
            });
          }
        }
        
        // Check subscription status and fix if needed
        const hasActiveSubscription = customer.subscriptions && 
                                    customer.subscriptions.data && 
                                    customer.subscriptions.data.some(sub => 
                                      sub.status === 'active' || sub.status === 'trialing');
        
        const currentSubTier = userData.subscriptionTier || 'free';
        const correctSubTier = hasActiveSubscription ? 'premium' : 'free';
        
        // Fix subscription tier if it's wrong
        if (currentSubTier !== correctSubTier || !userData.subscriptionStatus) {
          try {
            const subscriptionData = {
              subscriptionTier: correctSubTier,
              subscriptionStatus: hasActiveSubscription ? 'active' : 'cancelled',
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            
            // If there's an active subscription, get its ID and details
            if (hasActiveSubscription) {
              const activeSubscription = customer.subscriptions.data.find(sub => 
                sub.status === 'active' || sub.status === 'trialing');
              
              if (activeSubscription) {
                subscriptionData.subscriptionId = activeSubscription.id;
                subscriptionData.lastPaymentDate = admin.firestore.FieldValue.serverTimestamp();
                subscriptionData.lastPaymentStatus = 'succeeded';
              }
            } else {
              // Clear subscription ID if no active subscription
              subscriptionData.subscriptionId = null;
            }
            
            await userRef.update(subscriptionData);
            subscriptionFixedCount++;
            
            console.log(`Fixed subscription for user ${userId}: ${currentSubTier} → ${correctSubTier}`);
            
            // Create an audit log entry
            await db.collection('paymentAuditLogs').add({
              eventType: 'subscription_fixed_by_script',
              data: {
                userId,
                customerId: customer.id,
                previousTier: currentSubTier,
                newTier: correctSubTier,
                hasActiveSubscription,
                subscriptionData
              },
              timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
            
          } catch (error) {
            console.error(`Error fixing subscription tier: ${error.message}`);
            issues.push({
              type: 'subscription_fix_failed',
              userId,
              customerId: customer.id,
              error: error.message
            });
          }
        }
      }
      
      // Check if we have more customers to fetch
      hasMore = stripeCustomers.has_more;
      if (hasMore && stripeCustomers.data.length > 0) {
        startingAfter = stripeCustomers.data[stripeCustomers.data.length - 1].id;
      }
    }
    
    // Now check for users with premium tier but no stripeCustomerId
    console.log('Checking for users with premium tier but no Stripe customer ID...');
    const premiumUsersSnapshot = await db.collection('users')
      .where('subscriptionTier', '==', 'premium')
      .get();
    
    let inconsistentUserCount = 0;
    
    for (const userDoc of premiumUsersSnapshot.docs) {
      const userData = userDoc.data();
      
      if (!userData.stripeCustomerId) {
        console.warn(`User ${userDoc.id} has premium tier but no stripeCustomerId`);
        
        // Downgrade to free tier since we can't verify premium status
        try {
          await db.collection('users').doc(userDoc.id).update({
            subscriptionTier: 'free',
            subscriptionStatus: 'cancelled',
            subscriptionId: null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          inconsistentUserCount++;
          
          // Create an audit log entry
          await db.collection('paymentAuditLogs').add({
            eventType: 'inconsistent_premium_user_fixed',
            data: {
              userId: userDoc.id,
              previousTier: 'premium',
              newTier: 'free',
              reason: 'No Stripe customer ID found'
            },
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
          
          console.log(`Fixed inconsistent premium user ${userDoc.id}`);
        } catch (error) {
          console.error(`Error fixing inconsistent premium user: ${error.message}`);
          issues.push({
            type: 'inconsistent_user_fix_failed',
            userId: userDoc.id,
            error: error.message
          });
        }
      }
    }

    // Log results
    console.log('\nSubscription fix completed!');
    console.log('----------------------------------------');
    console.log(`Total Stripe customers processed: ${customerCount}`);
    console.log(`Customer documents created: ${customerDocCreatedCount}`);
    console.log(`User documents updated with stripeCustomerId: ${userUpdatedCount}`);
    console.log(`Subscription tiers fixed: ${subscriptionFixedCount}`);
    console.log(`Inconsistent premium users fixed: ${inconsistentUserCount}`);
    
    if (issues.length > 0) {
      console.log(`\nIssues encountered: ${issues.length}`);
      issues.forEach((issue, index) => {
        console.log(`\nIssue ${index + 1}:`);
        console.log(JSON.stringify(issue, null, 2));
      });
    } else {
      console.log('\nNo issues encountered!');
    }
    
    // Log a summary to Firestore for tracking
    await db.collection('syncLogs').add({
      type: 'fix_subscriptions_script',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      stats: {
        totalCustomers: customerCount,
        customerDocsCreated: customerDocCreatedCount,
        usersUpdated: userUpdatedCount,
        subscriptionsFixed: subscriptionFixedCount,
        inconsistentUsersFixed: inconsistentUserCount,
        issuesCount: issues.length
      },
      issues: issues.length > 0 ? issues : []
    });

  } catch (error) {
    console.error('Fatal error during subscription fix:', error);
  } finally {
    process.exit(0);
  }
}

// Run the subscription fix
fixUserSubscriptions();