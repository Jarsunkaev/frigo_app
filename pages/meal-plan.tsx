import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./api/firebase";
import { useSubscription } from '../hooks/useSubscription';
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import MealPlannerView from '../components/mealPlanner/MealPlanner';
import { 
  Calendar, 
  Loader, 
  PlusCircle,
  Users, 
  Trash2, 
  AlertCircle, 
  ChevronRight,
  Clock,
  LayoutGrid,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { collection, getDocs, query, orderBy, getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import axios from 'axios';

const MealPlanPage = () => {
  const [user, userLoading] = useAuthState(auth);
  const router = useRouter();
  const { isPremium, subscription, loading: subscriptionLoading } = useSubscription();
  const [availableIngredients, setAvailableIngredients] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const db = getFirestore();

  useEffect(() => {
    // Only redirect to login if authentication is finished and there is no user.
    if (!userLoading && !user) {
      router.replace('/login');
    }
  }, [user, userLoading, router]);

  // Automatically expand sidebar on larger screens and collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      setSidebarCollapsed(window.innerWidth < 1024);
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch saved recipes to extract ingredients
  useEffect(() => {
    const fetchSavedRecipes = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Get saved recipe IDs from Firestore
        const savedRecipesCollection = collection(db, "users", user.uid, "savedRecipes");
        const savedRecipesQuery = query(savedRecipesCollection, orderBy("savedAt", "desc"));
        const recipeSnapshot = await getDocs(savedRecipesQuery);
        
        if (recipeSnapshot.empty) {
          setAvailableIngredients([]);
          setIsLoading(false);
          return;
        }
        
        // Extract all ingredients from saved recipes
        const ingredientSet = new Set<string>();
        
        // This is simplified - you would need to fetch full recipe details
        // to get exact ingredients. For now, we'll simulate with some common ingredients
        const commonIngredients = [
          'chicken', 'beef', 'pasta', 'rice', 'potatoes', 'onions', 'garlic',
          'tomatoes', 'lettuce', 'carrots', 'eggs', 'milk', 'cheese', 'butter',
          'flour', 'sugar', 'salt', 'pepper', 'olive oil'
        ];
        
        // Randomly select some ingredients to simulate what the user has
        const numIngredients = Math.floor(Math.random() * 10) + 5; // 5-15 ingredients
        for (let i = 0; i < numIngredients; i++) {
          const randomIndex = Math.floor(Math.random() * commonIngredients.length);
          ingredientSet.add(commonIngredients[randomIndex]);
        }
        
        setAvailableIngredients(Array.from(ingredientSet));
      } catch (error) {
        console.error('Error fetching recipes:', error);
        setError('Failed to load your ingredients. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedRecipes();
  }, [user, db]);

  // Add a new ingredient
  const addIngredient = (ingredient: string) => {
    if (ingredient.trim() && !availableIngredients.includes(ingredient)) {
      setAvailableIngredients([...availableIngredients, ingredient]);
    }
  };

  // Remove an ingredient
  const removeIngredient = (ingredient: string) => {
    setAvailableIngredients(availableIngredients.filter(ing => ing !== ingredient));
  };
  
  // Add a recipe to saved recipes
  const addToSavedRecipes = async (recipeId: number) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Fetch recipe details
      const response = await axios.get(`/api/getRecipeDetails?id=${recipeId}`);
      const recipe = response.data;
      
      // Save to Firestore
      const recipeData = {
        id: recipe.id,
        title: recipe.title || "Untitled Recipe",
        image: recipe.image || '',
        readyInMinutes: recipe.readyInMinutes || 30,
        servings: recipe.servings || 4,
        sourceUrl: recipe.sourceUrl || '',
        diets: recipe.diets || [],
        savedAt: serverTimestamp()
      };
      
      const recipeRef = doc(db, "users", user.uid, "savedRecipes", recipeId.toString());
      await setDoc(recipeRef, recipeData);
      
      // Show success message (you could add state for this)
      alert('Recipe saved to your collection!');
    } catch (error) {
      console.error('Error saving recipe:', error);
      setError('Failed to save recipe. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMealPlan = () => {
    const mealPlannerView = document.getElementById('meal-planner-view');
    if (mealPlannerView) {
      mealPlannerView.scrollIntoView({ behavior: 'smooth' });
      
      // Find the generate meal plan button in the meal planner view and trigger a click
      const generateButton = mealPlannerView.querySelector('button');
      if (generateButton) {
        generateButton.click();
      }
      
      // On mobile, collapse the sidebar after generating
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      }
    }
  };

  // Show loading state while checking auth or fetching subscription.
  if (userLoading || (user && subscriptionLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100/50">
        <Header />
        <main className="flex-grow container mx-auto px-4 pt-32 pb-16">
          <div className="flex justify-center items-center min-h-[60vh]">
            <Loader className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Do not render content while redirecting to login.
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex flex-col">
      <Header />

      <main className="flex-grow container mx-auto px-3 sm:px-4 pt-20 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Page header */}
          <div className="mb-6 sm:mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Meal Planner</h1>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
              Plan your meals for the week based on ingredients you have, and get a shopping list for anything you're missing.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
              <p className="text-xs sm:text-sm">{error}</p>
            </div>
          )}

          {/* Mobile-friendly collapsible sidebar for ingredients */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-between bg-white p-4 rounded-xl shadow-md"
            >
              <div className="flex items-center">
                <span className="font-bold text-gray-900 mr-2">Your Ingredients</span>
                <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">
                  {availableIngredients.length}
                </span>
              </div>
              {sidebarCollapsed ? (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Sidebar with available ingredients */}
            <div className={`lg:col-span-1 ${sidebarCollapsed ? 'hidden lg:block' : 'block'}`}>
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:sticky lg:top-24">
                <h2 className="text-lg font-bold text-gray-900 mb-4 hidden lg:block">Your Ingredients</h2>
                
                {isLoading ? (
                  <div className="flex justify-center py-6 sm:py-8">
                    <Loader className="animate-spin w-6 h-6 sm:w-8 sm:h-8 text-amber-500" />
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Add ingredient..."
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              addIngredient((e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                        />
                        <button
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-amber-500"
                          onClick={() => {
                            const input = document.querySelector('input[placeholder="Add ingredient..."]') as HTMLInputElement;
                            if (input && input.value) {
                              addIngredient(input.value);
                              input.value = '';
                            }
                          }}
                        >
                          <PlusCircle className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Press Enter to add an ingredient</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 mb-4 max-h-48 sm:max-h-64 lg:max-h-96 overflow-y-auto">
                      {availableIngredients.length === 0 ? (
                        <p className="text-center text-gray-500 text-sm py-4">
                          No ingredients added yet
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {availableIngredients.map((ingredient, index) => (
                            <li 
                              key={index}
                              className="flex items-center justify-between bg-white p-2 rounded-md shadow-sm"
                            >
                              <span className="text-sm text-gray-700">{ingredient}</span>
                              <button
                                onClick={() => removeIngredient(ingredient)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-gray-600 mb-4">
                      These ingredients will be used to generate your meal plan. Add or remove ingredients to customize your plan.
                    </p>

                    <div className="text-center">
                      <button
                        onClick={handleGenerateMealPlan}
                        className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Generate Meal Plan
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Main meal planner view */}
            <div className="lg:col-span-3">
              <MealPlannerView 
                availableIngredients={availableIngredients} 
                onAddToSavedRecipes={addToSavedRecipes}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Floating action button on mobile */}
      <div className="lg:hidden fixed bottom-6 right-6 z-10">
        <button
          onClick={handleGenerateMealPlan}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-amber-500 text-white shadow-lg hover:bg-amber-600 transition-colors"
          aria-label="Generate Meal Plan"
        >
          <Calendar className="w-6 h-6" />
        </button>
      </div>

      <Footer />
    </div>
  );
};

export default MealPlanPage;