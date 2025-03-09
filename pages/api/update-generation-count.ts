// pages/api/update-generation-count.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import admin from '../../lib/firebaseAdmin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, action } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get reference to user document
    const userRef = admin.firestore().collection('users').doc(userId);
    
    // Get current user data
    const userSnapshot = await userRef.get();
    if (!userSnapshot.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userSnapshot.data() || {};
    const beforeCount = userData.dailyGenerations || 0;
    const subscriptionTier = (userData.subscriptionTier || 'free').toLowerCase();
    const maxGenerations = subscriptionTier === 'premium' ? 10 : 1;
    
    // Log current state
    console.log(`User ${userId} before update: ${beforeCount}/${maxGenerations} generations used`);

    // Check if we need to reset the daily counter (new day)
    const lastResetDate = userData.lastResetDate ? 
      new Date(userData.lastResetDate.toDate?.() || userData.lastResetDate) : 
      null;
    const now = new Date();
    
    let shouldReset = false;
    if (!lastResetDate || 
        lastResetDate.getDate() !== now.getDate() ||
        lastResetDate.getMonth() !== now.getMonth() ||
        lastResetDate.getFullYear() !== now.getFullYear()) {
      shouldReset = true;
      console.log(`Resetting daily counter for user ${userId} - last reset: ${lastResetDate?.toISOString() || 'never'}`);
    }

    if (action === 'increment') {
      // Perform an atomic update to increment or reset the counter
      if (shouldReset) {
        // Reset and set to 1 (this generation)
        await userRef.update({
          dailyGenerations: 1,
          lastResetDate: admin.firestore.FieldValue.serverTimestamp(),
          lastGenerationDate: admin.firestore.FieldValue.serverTimestamp(),
          lastUpdateTimestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Counter reset to 1 for user ${userId}`);
      } else {
        // Normal increment
        await userRef.update({
          dailyGenerations: admin.firestore.FieldValue.increment(1),
          lastGenerationDate: admin.firestore.FieldValue.serverTimestamp(),
          lastUpdateTimestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Counter incremented for user ${userId}`);
      }

      // Verify the update worked by reading the document again
      const verifyDoc = await userRef.get();
      const verifyData = verifyDoc.data() || {};
      const afterCount = verifyData.dailyGenerations || 0;
      
      console.log(`User ${userId} after update: ${afterCount}/${maxGenerations} generations used`);
      
      // Calculate remaining generations
      const remainingGenerations = Math.max(0, maxGenerations - afterCount);
      
      return res.status(200).json({ 
        success: true, 
        beforeCount,
        afterCount,
        remainingGenerations,
        maxGenerations,
        subscriptionTier
      });
    } 
    else if (action === 'check') {
      // Just return current counts without updating
      const remainingGenerations = Math.max(0, maxGenerations - beforeCount);
      
      return res.status(200).json({
        success: true,
        currentCount: beforeCount,
        remainingGenerations,
        maxGenerations,
        subscriptionTier
      });
    }
    else {
      return res.status(400).json({ error: 'Invalid action. Use "increment" or "check"' });
    }
  } catch (error) {
    console.error('Error updating generation count:', error);
    return res.status(500).json({ 
      error: 'Failed to update generation count',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}