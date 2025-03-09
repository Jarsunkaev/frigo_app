// utils/recipe-limits.ts
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
    
    const maxGenerations = subscriptionTier === 'premium' ? 10 : 1; // Free tier limit = 1

    console.log(`User ${userId} subscription tier: ${subscriptionTier}`);
    console.log(`User ${userId} daily generations: ${dailyGenerations}/${maxGenerations}`);

    if (dailyGenerations >= maxGenerations) {
      console.log(`User ${userId} has reached the daily limit`);
      return false;
    }

    // FIX: Use a transaction to ensure atomic update
    try {
      await db.runTransaction(async (transaction) => {
        // Get fresh user data within transaction
        const userSnapshot = await transaction.get(userRef);
        if (!userSnapshot.exists) {
          throw new Error("User document doesn't exist!");
        }
        
        const userData = userSnapshot.data() || {};
        const currentCount = userData.dailyGenerations || 0;
        
        // Update the document in the transaction
        transaction.update(userRef, {
          dailyGenerations: currentCount + 1,
          lastGenerationDate: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`Transaction prepared to update dailyGenerations from ${currentCount} to ${currentCount + 1}`);
      });
      
      console.log("Transaction completed successfully");
      
      // Verify the update by reading the document again
      const verificationDoc = await userRef.get();
      const verificationData = verificationDoc.data() || {};
      const newGenerationCount = verificationData.dailyGenerations || 0;
      
      console.log(`Verification: dailyGenerations is now ${newGenerationCount}`);
      
    } catch (transactionError) {
      console.error("Transaction failed:", transactionError);
      throw transactionError;
    }
    
    return true;
  } catch (error) {
    console.error(`Error in checkAndUpdateGenerationLimit for user ${userId}:`, error);
    // In case of error, we'll still allow generation to proceed
    // to prevent users from being blocked due to database errors
    return true;
  }
};