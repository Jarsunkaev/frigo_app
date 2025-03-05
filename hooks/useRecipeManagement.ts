// hooks/useRecipeManagement.ts
import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { 
  doc, 
  setDoc, 
  getDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  getFirestore, 
  serverTimestamp 
} from "firebase/firestore";
import { auth } from '../pages/api/firebase';

interface Recipe {
  id: number;
  title: string;
  image: string;
  readyInMinutes?: number;
  servings?: number;
  sourceUrl?: string;
  diets?: string[];
  [key: string]: any;
}

export function useRecipeManagement() {
  const [user] = useAuthState(auth);
  const [savedRecipeIds, setSavedRecipeIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const db = getFirestore();

  // Fetch saved recipe IDs when user changes
  useEffect(() => {
    const fetchSavedRecipes = async () => {
      if (!user) {
        setSavedRecipeIds([]);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const savedRecipesSnapshot = await getDocs(collection(db, "users", user.uid, "savedRecipes"));
        const recipeIds = savedRecipesSnapshot.docs.map(doc => parseInt(doc.id));
        
        setSavedRecipeIds(recipeIds);
      } catch (err) {
        console.error("Error fetching saved recipes:", err);
        setError("Failed to load your saved recipes");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedRecipes();
  }, [user, db]);

  // Function to check if a recipe is saved
  const isRecipeSaved = (recipeId: number): boolean => {
    return savedRecipeIds.includes(recipeId);
  };

  // Function to save a recipe
  const saveRecipe = async (recipe: Recipe): Promise<boolean> => {
    if (!user) {
      setError("You must be logged in to save recipes");
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const recipeData = {
        id: recipe.id,
        title: recipe.title,
        image: recipe.image,
        readyInMinutes: recipe.readyInMinutes || 30,
        servings: recipe.servings || 4,
        sourceUrl: recipe.sourceUrl || '',
        diets: recipe.diets || [],
        savedAt: serverTimestamp()
      };
      
      // Save to Firestore
      const recipeRef = doc(db, "users", user.uid, "savedRecipes", recipe.id.toString());
      await setDoc(recipeRef, recipeData);
      
      // Update local state
      if (!savedRecipeIds.includes(recipe.id)) {
        setSavedRecipeIds(prev => [...prev, recipe.id]);
      }
      
      // Update usage statistics
      try {
        const statsRef = doc(db, "users", user.uid, "usage", "statistics");
        const statsDoc = await getDoc(statsRef);
        
        if (statsDoc.exists()) {
          await setDoc(statsRef, {
            totalRecipesSaved: statsDoc.data().totalRecipesSaved + 1 || 1,
            lastUsageDate: serverTimestamp()
          }, { merge: true });
        } else {
          await setDoc(statsRef, {
            totalRecipesSaved: 1,
            totalGenerations: 0,
            lastUsageDate: serverTimestamp(),
            createdAt: serverTimestamp()
          });
        }
      } catch (statsError) {
        console.error("Error updating statistics:", statsError);
      }
      
      return true;
    } catch (err) {
      console.error("Error saving recipe:", err);
      setError("Failed to save recipe");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to remove a saved recipe
  const removeSavedRecipe = async (recipeId: number): Promise<boolean> => {
    if (!user) {
      setError("You must be logged in to remove saved recipes");
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Delete from Firestore
      const recipeRef = doc(db, "users", user.uid, "savedRecipes", recipeId.toString());
      await deleteDoc(recipeRef);
      
      // Update local state
      setSavedRecipeIds(prev => prev.filter(id => id !== recipeId));
      
      return true;
    } catch (err) {
      console.error("Error removing saved recipe:", err);
      setError("Failed to remove saved recipe");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to toggle recipe saved status
  const toggleSaveRecipe = async (recipe: Recipe): Promise<boolean> => {
    if (isRecipeSaved(recipe.id)) {
      return await removeSavedRecipe(recipe.id);
    } else {
      return await saveRecipe(recipe);
    }
  };

  return {
    savedRecipeIds,
    isLoading,
    error,
    isRecipeSaved,
    saveRecipe,
    removeSavedRecipe,
    toggleSaveRecipe
  };
}