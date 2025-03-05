import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./api/firebase";
import { useSubscription } from '../hooks/useSubscription';
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import { Filter, ChefHat, Crown, Loader, X, Clock } from 'lucide-react';
import { RecipeCard, RecipeModal } from '../components/uploadForm/RecipeComponents';
import FileUpload from "../components/uploadForm/FileUpload";

interface Alert {
  type: 'error' | 'success' | 'info' | 'warning';
  message: string;
}

interface RecipeFilters {
  maxTime?: number;
  diets: string[];
  sortBy: 'default' | 'time' | 'servings';
}

const AlertComponent = ({ type, message, onClose }: Alert & { onClose?: () => void }) => {
  const colors = {
    error: 'bg-red-50 text-red-700 border-red-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200'
  };

  return (
    <div className={`rounded-lg p-4 mb-4 flex items-center justify-between ${colors[type]} border`}>
      <p className="text-sm">{message}</p>
      {onClose && (
        <button 
          onClick={onClose}
          className="ml-4 text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      )}
    </div>
  );
};

const FilterModal = ({ isOpen, onClose, onApply, currentFilters }) => {
  const [filters, setFilters] = useState<RecipeFilters>({...currentFilters});

  const dietOptions = [
    'Vegetarian',
    'Vegan',
    'Gluten Free',
    'Dairy Free',
    'Low Carb'
  ];

  const timeOptions = [
    { label: 'Any time', value: undefined },
    { label: 'Under 15 minutes', value: 15 },
    { label: 'Under 30 minutes', value: 30 },
    { label: 'Under 60 minutes', value: 60 }
  ];

  const sortOptions = [
    { label: 'Default', value: 'default' },
    { label: 'Preparation time', value: 'time' },
    { label: 'Servings', value: 'servings' }
  ];

  const handleDietToggle = (diet: string) => {
    setFilters(prev => {
      if (prev.diets.includes(diet)) {
        return { ...prev, diets: prev.diets.filter(d => d !== diet) };
      } else {
        return { ...prev, diets: [...prev.diets, diet] };
      }
    });
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    const defaultFilters: RecipeFilters = {
      maxTime: undefined,
      diets: [],
      sortBy: 'default'
    };
    setFilters(defaultFilters);
    onApply(defaultFilters);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      <div className="min-h-screen px-4 py-8 flex items-center justify-center">
        <div 
          className="relative bg-white w-full max-w-md rounded-2xl shadow-xl p-6"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Filter Recipes</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Time filter */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-800 mb-3">Preparation Time</h4>
            <div className="space-y-2">
              {timeOptions.map(option => (
                <label 
                  key={option.label} 
                  className="flex items-center cursor-pointer"
                >
                  <input
                    type="radio"
                    name="maxTime"
                    checked={filters.maxTime === option.value}
                    onChange={() => setFilters(prev => ({ ...prev, maxTime: option.value }))}
                    className="w-4 h-4 text-amber-500 focus:ring-amber-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Diet restrictions */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-800 mb-3">Dietary Preferences</h4>
            <div className="flex flex-wrap gap-2">
              {dietOptions.map(diet => (
                <button
                  key={diet}
                  onClick={() => handleDietToggle(diet)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    filters.diets.includes(diet)
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {diet}
                </button>
              ))}
            </div>
          </div>

          {/* Sort by */}
          <div className="mb-8">
            <h4 className="font-medium text-gray-800 mb-3">Sort By</h4>
            <select
              value={filters.sortBy}
              onChange={e => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleReset}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleApply}
              className="flex-1 py-2.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function GeneratePage() {
  const [user, authLoading] = useAuthState(auth);
  const router = useRouter();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<any[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [savedRecipes, setSavedRecipes] = useState<any[]>([]);
  const [alert, setAlert] = useState<Alert | null>(null);
  const [trivia, setTrivia] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRecipe, setIsLoadingRecipe] = useState(false);
  const [activeFilters, setActiveFilters] = useState<RecipeFilters>({
    maxTime: undefined,
    diets: [],
    sortBy: 'default'
  });
  const [filterCount, setFilterCount] = useState(0);

  useEffect(() => {
    // Calculate active filter count
    const count = 
      (activeFilters.maxTime ? 1 : 0) + 
      (activeFilters.diets.length) + 
      (activeFilters.sortBy !== 'default' ? 1 : 0);
    setFilterCount(count);
  }, [activeFilters]);

  useEffect(() => {
    // Only redirect to login if authentication is finished and there is no user.
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // Fetch trivia
  useEffect(() => {
    const fetchTrivia = async () => {
      try {
        const response = await fetch('/api/foodTrivia');
        const data = await response.json();
        setTrivia(data.fact);
      } catch (error) {
        console.error('Failed to fetch trivia:', error);
      }
    };
    fetchTrivia();
  }, []);

  // Apply filters whenever recipes or activeFilters change
  // This is purely a client-side operation and does not need subscription verification
  useEffect(() => {
    if (recipes.length === 0) {
      setFilteredRecipes([]);
      return;
    }

    let result = [...recipes];

    // Apply time filter
    if (activeFilters.maxTime) {
      result = result.filter(recipe => 
        recipe.readyInMinutes && recipe.readyInMinutes <= activeFilters.maxTime
      );
    }

    // Apply diet filters
    if (activeFilters.diets.length > 0) {
      result = result.filter(recipe => {
        // If recipe has diets property and it's an array
        if (recipe.diets && Array.isArray(recipe.diets)) {
          return activeFilters.diets.some(diet => 
            recipe.diets.some((recipeDiet: string) => 
              recipeDiet.toLowerCase() === diet.toLowerCase()
            )
          );
        }
        // If we don't have diet info, keep the recipe
        return true;
      });
    }

    // Apply sorting
    if (activeFilters.sortBy !== 'default') {
      result.sort((a, b) => {
        if (activeFilters.sortBy === 'time') {
          return (a.readyInMinutes || 9999) - (b.readyInMinutes || 9999);
        } else if (activeFilters.sortBy === 'servings') {
          return (b.servings || 0) - (a.servings || 0);
        }
        return 0;
      });
    }

    setFilteredRecipes(result);
  }, [recipes, activeFilters]);

  // Fetch saved recipes
  useEffect(() => {
    const fetchSavedRecipes = async () => {
      if (user) {
        try {
          // This would typically be an API call to get user's saved recipe IDs
          // For now, we're just using a placeholder
          const savedRecipeIds: number[] = [];
          setSavedRecipes(savedRecipeIds);
        } catch (error) {
          console.error('Error fetching saved recipes:', error);
        }
      }
    };
    
    fetchSavedRecipes();
  }, [user]);

  const handleRecipesGenerated = async (newRecipes: any[]) => {
    // This function needs subscription verification because it's related to generating new recipes
    if (!subscription) {
      setAlert({
        type: 'error',
        message: 'Unable to verify subscription status'
      });
      return;
    }

    if (subscription.generationsLeft <= 0) {
      setAlert({
        type: 'warning',
        message: subscription.tier === 'premium' 
          ? 'Daily generation limit reached. Try again tomorrow!' 
          : 'Daily generation limit reached. Upgrade to premium for more generations!'
      });
      return;
    }

    try {
      // Mark recipes as premium based on subscription status.
      const processedRecipes = newRecipes.map((recipe, index) => ({
        ...recipe,
        isPremiumOnly: subscription.tier === 'free' && index >= subscription.limits.maxSuggestions
      }));

      setRecipes(processedRecipes);
      setFilteredRecipes(processedRecipes); // Initialize filtered recipes with all recipes
      setIsLoading(false);
      
      // Reset filters when new recipes are generated
      setActiveFilters({
        maxTime: undefined,
        diets: [],
        sortBy: 'default'
      });
      
      setAlert({
        type: 'success',
        message: `Generated ${newRecipes.length} recipes based on your ingredients!`
      });
    } catch (error) {
      console.error('Error processing recipes:', error);
      setAlert({
        type: 'error',
        message: 'Failed to process recipes'
      });
    }
  };

  const handleSaveRecipe = async (recipe: any) => {
    if (!user) {
      setAlert({
        type: 'error',
        message: 'Please sign in to save recipes'
      });
      return;
    }

    try {
      // This would typically be an API call to save the recipe
      console.log('Recipe saved:', recipe);
      
      // Add the recipe ID to the saved recipes list
      setSavedRecipes(prev => [...prev, recipe.id]);
      
      setAlert({
        type: 'success',
        message: 'Recipe saved successfully!'
      });
    } catch (error) {
      console.error('Error saving recipe:', error);
      setAlert({
        type: 'error',
        message: 'Failed to save recipe'
      });
    }
  };

  const handleViewRecipe = async (recipe: any) => {
    // This function needs subscription verification for premium recipes
    if (recipe.isPremiumOnly && subscription?.tier === 'free') {
      setAlert({
        type: 'info',
        message: 'This is a premium recipe. Upgrade to view it!'
      });
      return;
    }

    try {
      setIsLoadingRecipe(true);
      const response = await fetch(`/api/getRecipeDetails?id=${recipe.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch recipe details');
      }

      const data = await response.json();
      setSelectedRecipe({
        ...data,
        isPremiumOnly: recipe.isPremiumOnly
      });
    } catch (error) {
      console.error('Failed to fetch recipe details:', error);
      setAlert({
        type: 'error',
        message: 'Failed to load recipe details. Please try again.'
      });
    } finally {
      setIsLoadingRecipe(false);
    }
  };

  // Filter handler - doesn't need subscription verification
  const handleApplyFilters = (filters: RecipeFilters) => {
    setActiveFilters(filters);
    // The filtering itself is handled by the useEffect
  };

  // Prepare subscription status for FileUpload component
  const subscriptionStatus = subscription ? {
    subscriptionTier: subscription.tier,
    limits: {
      remainingGenerations: subscription.generationsLeft,
      maxGenerations: subscription.limits.maxGenerations,
      maxSuggestions: subscription.limits.maxSuggestions
    }
  } : null;

  // Show loading state while checking auth or fetching subscription.
  if (authLoading || (user && subscriptionLoading)) {
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
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <Header />

      <main className="relative z-10 container mx-auto px-4 pt-16 pb-16">
        {alert && (
          <AlertComponent
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Trivia Section */}
        {trivia && (
          <div className="max-w-7xl mx-auto mb-8">
            <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-6">
              <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                <div className="flex-shrink-0">
                  <ChefHat className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-base sm:text-lg mb-1">Did you know?</h3>
                  <p className="text-gray-600 text-sm sm:text-base">{trivia}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-8 max-w-7xl mx-auto">
          {/* File Upload Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 sticky top-24">
              <FileUpload 
                onRecipesGenerated={handleRecipesGenerated} 
                setIsLoading={setIsLoading}
                subscriptionStatus={subscriptionStatus}
              />
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
              <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-4 mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Recipe Results 
                  {filteredRecipes.length > 0 && recipes.length > 0 && filteredRecipes.length !== recipes.length && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      Showing {filteredRecipes.length} of {recipes.length}
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setIsFilterOpen(true)}
                    className="w-full sm:w-auto px-4 py-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors duration-300 flex items-center justify-center gap-2 relative"
                  >
                    <Filter className="w-5 h-5" />
                    <span className="sm:inline">Filter Recipes</span>
                    {filterCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-amber-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center">
                        {filterCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Active filters display */}
              {filterCount > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-sm text-gray-500">Active filters:</span>
                  
                  {activeFilters.maxTime && (
                    <div className="bg-amber-50 px-2 py-1 rounded-full text-xs flex items-center gap-1 text-amber-700">
                      <Clock className="w-3 h-3" />
                      <span>Under {activeFilters.maxTime}min</span>
                      <button 
                        className="ml-1 hover:text-amber-800" 
                        onClick={() => setActiveFilters(prev => ({ ...prev, maxTime: undefined }))}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  
                  {activeFilters.diets.map(diet => (
                    <div key={diet} className="bg-amber-50 px-2 py-1 rounded-full text-xs flex items-center gap-1 text-amber-700">
                      <span>{diet}</span>
                      <button 
                        className="ml-1 hover:text-amber-800" 
                        onClick={() => setActiveFilters(prev => ({ 
                          ...prev, 
                          diets: prev.diets.filter(d => d !== diet)
                        }))}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  
                  {activeFilters.sortBy !== 'default' && (
                    <div className="bg-amber-50 px-2 py-1 rounded-full text-xs flex items-center gap-1 text-amber-700">
                      <span>Sort: {activeFilters.sortBy === 'time' ? 'Time' : 'Servings'}</span>
                      <button 
                        className="ml-1 hover:text-amber-800" 
                        onClick={() => setActiveFilters(prev => ({ ...prev, sortBy: 'default' }))}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  
                  <button 
                    className="text-xs text-amber-600 hover:text-amber-800 ml-2"
                    onClick={() => setActiveFilters({
                      maxTime: undefined,
                      diets: [],
                      sortBy: 'default'
                    })}
                  >
                    Clear all
                  </button>
                </div>
              )}

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Generating recipes...</p>
                </div>
              ) : filteredRecipes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredRecipes.map((recipe) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      onView={handleViewRecipe}
                      onSave={handleSaveRecipe}
                      isSaved={savedRecipes.includes(recipe.id)}
                      isPremium={recipe.isPremiumOnly}
                      userSubscriptionTier={subscription?.tier}
                    />
                  ))}
                </div>
              ) : recipes.length > 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <Filter className="mx-auto h-10 w-10 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No recipes match your filters</h3>
                  <p className="mt-1 text-gray-500">Try adjusting your filters or clear them to see all recipes</p>
                  <button 
                    className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                    onClick={() => setActiveFilters({
                      maxTime: undefined,
                      diets: [],
                      sortBy: 'default'
                    })}
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <ChefHat className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No recipes yet</h3>
                  <p className="mt-1 text-gray-500">Upload a photo or add ingredients to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Filter Modal */}
      <FilterModal 
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleApplyFilters}
        currentFilters={activeFilters}
      />

      {/* Recipe Modal */}
      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          isLoading={isLoadingRecipe}
          isPremium={selectedRecipe.isPremiumOnly}
          userSubscriptionTier={subscription?.tier}
        />
      )}

      <Footer />
    </div>
  );
}

export default GeneratePage;