// utils/generationLimit.ts
import { db, admin } from '../lib/firebaseAdmin';

export const checkAndUpdateGenerationLimit = async (userId: string): Promise<boolean> => {
  console.log(`Checking generation limit for user: ${userId}`);
  
  try {
    const userRef = db.doc(`users/${userId}`);
    let userDoc = await userRef.get();

    // If the user document doesn't exist, create it with default values.
    if (!userDoc.exists) {
      console.log(`User document not found, creating for user: ${userId}`);
      await userRef.set({
        dailyGenerations: 0,
        subscriptionTier: 'free',
        lastGenerationDate: admin.firestore.FieldValue.serverTimestamp(),
        lastResetDate: admin.firestore.FieldValue.serverTimestamp()
      });
      userDoc = await userRef.get(); // Fetch the newly created document
      console.log(`User document created for: ${userId}`);
    }

    // Check if we need to reset the daily counter
    const userData = userDoc.data() || {};
    const lastResetDate = userData.lastResetDate ? new Date(userData.lastResetDate.toDate()) : null;
    const now = new Date();
    
    console.log(`Last reset date: ${lastResetDate ? lastResetDate.toISOString() : 'none'}`);
    console.log(`Current date: ${now.toISOString()}`);
    
    if (!lastResetDate || 
        lastResetDate.getDate() !== now.getDate() ||
        lastResetDate.getMonth() !== now.getMonth() ||
        lastResetDate.getFullYear() !== now.getFullYear()) {
      // Reset counter if it's a new day
      console.log(`Resetting generation counter for user: ${userId}`);
      await userRef.update({
        dailyGenerations: 0,
        lastResetDate: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Refresh user data after reset
      userDoc = await userRef.get();
      console.log(`Counter reset for user: ${userId}`);
    }

    // Get fresh data
    const refreshedData = userDoc.data() || {};
    const dailyGenerations = refreshedData.dailyGenerations || 0;
    const subscriptionTier = (refreshedData.subscriptionTier || 'free').toLowerCase();
    
    // Update this line - change free tier from 3 to 1
    const maxGenerations = subscriptionTier === 'premium' ? 10 : 1;

    console.log(`User ${userId} subscription tier: ${subscriptionTier}`);
    console.log(`User ${userId} daily generations: ${dailyGenerations}/${maxGenerations}`);

    if (dailyGenerations >= maxGenerations) {
      console.log(`User ${userId} has reached the daily limit`);
      return false;
    }

    // Increment counter
    console.log(`Incrementing generation count for user: ${userId}`);
    await userRef.update({
      dailyGenerations: admin.firestore.FieldValue.increment(1),
      lastGenerationDate: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Successfully updated generation count for user: ${userId}`);
    return true;
  } catch (error) {
    console.error(`Error in checkAndUpdateGenerationLimit for user ${userId}:`, error);
    // In case of error, allow generation to proceed
    // This prevents users from being blocked due to database errors
    return true;
  }
};