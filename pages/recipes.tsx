// pages/recipes.tsx - Enhanced with better UI and mobile responsiveness
import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { collection, getDocs, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { useRouter } from "next/router";
import axios from "axios";
import { auth, db } from "./api/firebase";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import { 
  Clock, 
  Users, 
  ExternalLink, 
  Search, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  X,
  ChefHat,
  Flame,
  AlertCircle,
  Heart,
  Leaf,
  Trash2,
  Loader,
  CheckCircle
} from 'lucide-react';
import { RecipeModal } from '../components/uploadForm/RecipeComponents';

type RecipeDetails = {
  id: number;
  title: string;
  servings: number;
  readyInMinutes: number;
  sourceUrl: string;
  image: string;
  instructions: string;
  diets?: string[];
  extendedIngredients?: { original: string }[];
  savedAt?: any;
};

const SavedRecipes = () => {
  const [recipes, setRecipes] = useState<RecipeDetails[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<RecipeDetails[]>([]);
  const [user, loading, error] = useAuthState(auth);
  const router = useRouter();
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRecipe, setIsLoadingRecipe] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sortOption, setSortOption] = useState<'newest' | 'time' | 'alphabetical'>('newest');
  const [filterDiet, setFilterDiet] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const itemsPerPage = 9;

  useEffect(() => {
    if (loading) return;
    if (!user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    const fetchSavedRecipes = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        setLoadError(null);
        
        // Get saved recipe IDs from Firestore
        const savedRecipesCollection = collection(db, "users", user.uid, "savedRecipes");
        const savedRecipesQuery = query(savedRecipesCollection, orderBy("savedAt", "desc"));
        const recipeSnapshot = await getDocs(savedRecipesQuery);
        
        if (recipeSnapshot.empty) {
          setRecipes([]);
          setFilteredRecipes([]);
          setIsLoading(false);
          return;
        }
        
        console.log(`Found ${recipeSnapshot.size} saved recipes`);
        
        // Get the recipe details from Firestore first
        const savedRecipes = recipeSnapshot.docs.map(doc => ({
          id: parseInt(doc.id),
          title: doc.data().title || "Recipe",
          servings: doc.data().servings || 4,
          readyInMinutes: doc.data().readyInMinutes || 30,
          sourceUrl: doc.data().sourceUrl || "",
          image: doc.data().image || "",
          savedAt: doc.data().savedAt
        }));

        // Fetch full recipe details for each saved recipe
        const recipeDetailsPromises = savedRecipes.map(async (savedRecipe) => {
          try {
            const response = await axios.get(`/api/getRecipeDetails?id=${savedRecipe.id}`);
            return {
              ...response.data,
              savedAt: savedRecipe.savedAt
            };
          } catch (error) {
            console.error(`Error fetching recipe details for ID ${savedRecipe.id}:`, error);
            // Return basic data we have from Firestore if API fails
            return {
              id: savedRecipe.id,
              title: savedRecipe.title || "Recipe",
              servings: savedRecipe.servings || 4,
              readyInMinutes: savedRecipe.readyInMinutes || 30,
              sourceUrl: savedRecipe.sourceUrl || "",
              image: savedRecipe.image || "",
              instructions: "Recipe details could not be loaded.",
              savedAt: savedRecipe.savedAt
            };
          }
        });

        // Wait for all recipe details to be fetched
        const recipeResults = await Promise.allSettled(recipeDetailsPromises);
        
        // Filter out rejected promises and extract recipe data
        const recipeList = recipeResults
          .filter((result): result is PromiseFulfilledResult<RecipeDetails> => 
            result.status === 'fulfilled')
          .map(result => result.value);

        console.log("Fetched Recipes:", recipeList);
        
        setRecipes(recipeList);
        setFilteredRecipes(recipeList);
      } catch (error) {
        console.error('Error fetching recipes:', error);
        setLoadError("Failed to load your saved recipes. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedRecipes();
  }, [user]);

  // Apply filters, sorting, and search
  useEffect(() => {
    let result = [...recipes];

    // Apply search filter
    if (searchQuery.trim() !== "") {
      result = result.filter(recipe =>
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply diet filter
    if (filterDiet) {
      result = result.filter(recipe => 
        recipe.diets?.some(diet => 
          diet.toLowerCase() === filterDiet.toLowerCase()
        )
      );
    }

    // Apply sorting
    switch (sortOption) {
      case 'newest':
        result.sort((a, b) => {
          if (!a.savedAt || !b.savedAt) return 0;
          // Handle Firestore timestamps or ISO strings
          const dateA = a.savedAt.toDate ? a.savedAt.toDate() : new Date(a.savedAt);
          const dateB = b.savedAt.toDate ? b.savedAt.toDate() : new Date(b.savedAt);
          return dateB.getTime() - dateA.getTime();
        });
        break;
      case 'time':
        result.sort((a, b) => (a.readyInMinutes || 0) - (b.readyInMinutes || 0));
        break;
      case 'alphabetical':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    setFilteredRecipes(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, recipes, sortOption, filterDiet]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredRecipes.length / itemsPerPage);
  const paginatedRecipes = filteredRecipes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleViewRecipe = async (recipe: RecipeDetails) => {
    try {
      setIsLoadingRecipe(true);
      setLoadError(null);
      
      const response = await axios.get(`/api/getRecipeDetails?id=${recipe.id}`);
      setSelectedRecipe(response.data);
    } catch (error) {
      console.error('Failed to fetch recipe details:', error);
      // Use basic recipe info if API fails
      setSelectedRecipe({
        ...recipe,
        instructions: "Failed to load detailed recipe instructions. Please try again or visit the original recipe page."
      });
    } finally {
      setIsLoadingRecipe(false);
    }
  };

  const handleDeleteRecipe = async (recipeId: number) => {
    if (!user) return;
    
    try {
      setIsDeleting(recipeId);
      
      // Delete from Firestore
      const recipeRef = doc(db, "users", user.uid, "savedRecipes", recipeId.toString());
      await deleteDoc(recipeRef);
      
      // Also call the API to properly handle any additional cleanup
      await axios.post('/api/saveRecipe', {
        recipe: { id: recipeId },
        action: 'remove'
      }, {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });
      
      // Update local state
      setRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
      setAlertMessage({
        type: 'success',
        message: 'Recipe removed successfully'
      });
      
      // Auto-dismiss message after 3 seconds
      setTimeout(() => {
        setAlertMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error deleting recipe:', error);
      setAlertMessage({
        type: 'error',
        message: 'Failed to remove recipe. Please try again.'
      });
    } finally {
      setIsDeleting(null);
    }
  };

  // Extract unique diet types from all recipes
  const allDietTypes = Array.from(
    new Set(
      recipes
        .flatMap(recipe => recipe.diets || [])
        .filter(diet => diet)
    )
  );

  // Function to clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSortOption("newest");
    setFilterDiet(null);
    setIsFilterOpen(false);
  };

  const RecipeCard = ({ recipe }: { recipe: RecipeDetails }) => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
      <div className="relative h-40 sm:h-48">
        <img 
          src={recipe.image} 
          alt={recipe.title} 
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = "https://via.placeholder.com/400x300?text=Recipe+Image";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {recipe.diets && recipe.diets.includes('vegetarian') && (
          <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
            Vegetarian
          </div>
        )}
        
        {recipe.readyInMinutes && recipe.readyInMinutes <= 30 && (
          <div className="absolute top-3 right-12 bg-amber-500 text-white p-1.5 rounded-full">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
        )}
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleDeleteRecipe(recipe.id);
          }}
          className="absolute top-3 right-3 bg-red-500/90 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors"
          disabled={isDeleting === recipe.id}
          aria-label="Delete recipe"
        >
          {isDeleting === recipe.id ? (
            <Loader className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
          ) : (
            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
          )}
        </button>
      </div>
      
      <div className="p-4 sm:p-6">
        <h3 className="font-bold text-base sm:text-xl mb-3 sm:mb-4 text-gray-800 line-clamp-2">{recipe.title}</h3>
        
        <div className="flex flex-wrap gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center text-gray-600">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            <span className="text-xs sm:text-sm">{recipe.readyInMinutes || 30}min</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            <span className="text-xs sm:text-sm">{recipe.servings || 4} servings</span>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => handleViewRecipe(recipe)}
            className="w-full py-2 sm:py-2.5 bg-amber-500 text-white rounded-lg font-semibold 
                     hover:bg-amber-600 transition-colors duration-300 text-xs sm:text-sm"
          >
            View Recipe
          </button>

          {recipe.sourceUrl && (
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 sm:py-2.5 flex items-center justify-center gap-1 sm:gap-2 bg-gray-50 
                       text-gray-700 rounded-lg font-semibold hover:bg-gray-100 
                       transition-colors duration-300 text-xs sm:text-sm"
            >
              <span>View Original</span>
              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );

  const RecipeListItem = ({ recipe }: { recipe: RecipeDetails }) => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
      <div className="relative h-24 w-full sm:h-auto sm:w-32 shrink-0">
        <img 
          src={recipe.image} 
          alt={recipe.title} 
          className="w-full h-full object-cover rounded-lg"
          onError={(e) => {
            e.currentTarget.src = "https://via.placeholder.com/400x300?text=Recipe+Image";
          }}
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleDeleteRecipe(recipe.id);
          }}
          className="absolute top-2 right-2 bg-red-500/90 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
          disabled={isDeleting === recipe.id}
          aria-label="Delete recipe"
        >
          {isDeleting === recipe.id ? (
            <Loader className="w-3 h-3 animate-spin" />
          ) : (
            <Trash2 className="w-3 h-3" />
          )}
        </button>
      </div>
      
      <div className="flex-grow">
        <h3 className="font-bold text-base sm:text-lg mb-2 text-gray-800">{recipe.title}</h3>
        
        <div className="flex flex-wrap gap-3 sm:gap-4 mb-2">
          <div className="flex items-center text-gray-600">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            <span className="text-xs sm:text-sm">{recipe.readyInMinutes || 30}min</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            <span className="text-xs sm:text-sm">{recipe.servings || 4} servings</span>
          </div>
          {recipe.diets && recipe.diets.length > 0 && (
            <div className="flex items-center text-green-600">
              <Leaf className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span className="text-xs sm:text-sm">{recipe.diets[0]}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex sm:flex-col gap-2 shrink-0 self-end sm:self-center">
        <button
          onClick={() => handleViewRecipe(recipe)}
          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-500 text-white rounded-lg font-semibold 
                   hover:bg-amber-600 transition-colors duration-300 text-xs sm:text-sm"
        >
          View
        </button>

        {recipe.sourceUrl && (
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-center gap-1 bg-gray-50 
                     text-gray-700 rounded-lg font-semibold hover:bg-gray-100 
                     transition-colors duration-300 text-xs sm:text-sm"
          >
            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
          </a>
        )}
      </div>
    </div>
  );

  const FilterModal = () => (
    <div className={`fixed inset-0 z-40 ${isFilterOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-300`}>
      <div className="fixed inset-0 bg-black/50" onClick={() => setIsFilterOpen(false)} />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div 
          className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl p-4 sm:p-6 transform transition-transform duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold">Filter Recipes</h3>
            <button 
              onClick={() => setIsFilterOpen(false)}
              className="p-1.5 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Sort options */}
          <div className="mb-6">
            <h4 className="font-medium text-sm sm:text-base mb-2">Sort By</h4>
            <div className="space-y-2">
              {[
                { value: 'newest', label: 'Newest First' },
                { value: 'time', label: 'Cooking Time (Quickest First)' },
                { value: 'alphabetical', label: 'Alphabetical (A-Z)' }
              ].map(option => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    name="sortOption"
                    value={option.value}
                    checked={sortOption === option.value}
                    onChange={() => setSortOption(option.value as any)}
                    className="w-4 h-4 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="ml-2 text-sm sm:text-base">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Diet filter */}
          {allDietTypes.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-sm sm:text-base mb-2">Diet Type</h4>
              <select
                value={filterDiet || ''}
                onChange={(e) => setFilterDiet(e.target.value || null)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm sm:text-base"
              >
                <option value="">All Diets</option>
                {allDietTypes.map(diet => (
                  <option key={diet} value={diet}>{diet}</option>
                ))}
              </select>
            </div>
          )}
          
          {/* Buttons */}
          <div className="flex gap-3 sm:gap-4">
            <button
              onClick={clearFilters}
              className="flex-1 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm sm:text-base"
            >
              Reset Filters
            </button>
            <button
              onClick={() => setIsFilterOpen(false)}
              className="flex-1 py-2 sm:py-2.5 bg-amber-500 text-white rounded-lg font-semibold text-sm sm:text-base"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100/50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          <p className="mt-4 text-gray-600">Loading your delicious recipes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50 to-amber-100/50">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-12 sm:py-16 pt-20 sm:pt-24">
        <div className="max-w-6xl mx-auto">
          {/* Page header with title and description */}
          <div className="mb-6 sm:mb-8 text-center">
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">Your Recipe Collection</h1>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
              All your saved recipes in one place. Browse, search, and organize your culinary inspirations.
            </p>
          </div>
          
          {/* Alert Messages */}
          {alertMessage && (
            <div className={`mb-4 p-3 sm:p-4 rounded-lg flex items-center justify-between
              ${alertMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}
            >
              <div className="flex items-center">
                {alertMessage.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                )}
                <p className="text-sm">{alertMessage.message}</p>
              </div>
              <button 
                onClick={() => setAlertMessage(null)}
                className="p-1 ml-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {/* Search and filter bar */}
          <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Search input */}
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="Search your recipes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm sm:text-base"
                />
              </div>
              
              {/* View toggle buttons */}
              <div className="flex-shrink-0 flex">
                <button
                  onClick={() => setView('grid')}
                  className={`px-3 py-2 rounded-l-lg border border-gray-200 ${
                    view === 'grid' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-700'
                  }`}
                >
                  <div className="grid grid-cols-2 gap-0.5">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-current rounded-sm"></div>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-current rounded-sm"></div>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-current rounded-sm"></div>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-current rounded-sm"></div>
                  </div>
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`px-3 py-2 rounded-r-lg border border-gray-200 ${
                    view === 'list' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-700'
                  } border-l-0`}
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="w-4 h-1 bg-current rounded-sm"></div>
                    <div className="w-4 h-1 bg-current rounded-sm"></div>
                    <div className="w-4 h-1 bg-current rounded-sm"></div>
                  </div>
                </button>
              </div>
              
              {/* Filter button */}
              <button
                onClick={() => setIsFilterOpen(true)}
                className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors duration-300"
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm">Filters</span>
              </button>
            </div>

            {/* Active filters display */}
            {(searchQuery || filterDiet || sortOption !== 'newest') && (
              <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs sm:text-sm text-gray-500">Active filters:</span>
                
                {searchQuery && (
                  <div className="bg-blue-50 px-2 py-1 rounded-full text-xs flex items-center gap-1 text-blue-700">
                    <span>Search: {searchQuery}</span>
                    <button 
                      className="ml-1 hover:text-blue-800" 
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                
                {filterDiet && (
                  <div className="bg-green-50 px-2 py-1 rounded-full text-xs flex items-center gap-1 text-green-700">
                    <span>Diet: {filterDiet}</span>
                    <button 
                      className="ml-1 hover:text-green-800" 
                      onClick={() => setFilterDiet(null)}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                
                {sortOption !== 'newest' && (
                  <div className="bg-amber-50 px-2 py-1 rounded-full text-xs flex items-center gap-1 text-amber-700">
                    <span>Sort: {sortOption === 'time' ? 'Quick First' : 'A-Z'}</span>
                    <button 
                      className="ml-1 hover:text-amber-800" 
                      onClick={() => setSortOption('newest')}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                
                <button 
                  className="text-xs text-blue-600 hover:text-blue-800 ml-2"
                  onClick={clearFilters}
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {loadError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <p className="text-sm">{loadError}</p>
            </div>
          )}

          {/* Filter Modal */}
          <FilterModal />

          {/* Recipe count and stats */}
          {filteredRecipes.length > 0 && (
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <p className="text-xs sm:text-sm text-gray-600">
                Showing {paginatedRecipes.length} of {filteredRecipes.length} recipes
              </p>
              
              {recipes.length > 0 && (
                <div className="bg-amber-50 px-2 sm:px-3 py-1 rounded-lg text-amber-700 text-xs sm:text-sm flex items-center">
                  <Heart className="w-3 h-3 sm:w-4 sm:h-4 mr-1 fill-amber-500 stroke-amber-500" />
                  <span>{recipes.length} saved recipes</span>
                </div>
              )}
            </div>
          )}

          {/* Recipes display */}
          {filteredRecipes.length > 0 ? (
            <>
              {view === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {paginatedRecipes.map((recipe) => (
                    <RecipeCard key={recipe.id} recipe={recipe} />
                  ))}
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {paginatedRecipes.map((recipe) => (
                    <RecipeListItem key={recipe.id} recipe={recipe} />
                  ))}
                </div>
              )}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 sm:mt-8 flex justify-center items-center space-x-1 sm:space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`p-1.5 sm:p-2 rounded-full ${
                      currentPage === 1 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  
                  {totalPages <= 5 ? (
                    // Show all pages if there are 5 or fewer
                    [...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full ${
                          currentPage === i + 1
                            ? 'bg-amber-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <span className="text-xs sm:text-sm">{i + 1}</span>
                      </button>
                    ))
                  ) : (
                    // Show limited pages with ellipsis for many pages
                    <>
                      {/* First page */}
                      <button
                        onClick={() => setCurrentPage(1)}
                        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full ${
                          currentPage === 1
                            ? 'bg-amber-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <span className="text-xs sm:text-sm">1</span>
                      </button>
                      
                      {/* Ellipsis or second page */}
                      {currentPage > 3 && (
                        <span className="text-gray-500">...</span>
                      )}
                      
                      {/* Pages around current page */}
                      {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        // Show current page and adjacent pages
                        if (
                          pageNum !== 1 && 
                          pageNum !== totalPages && 
                          (pageNum === currentPage || 
                           pageNum === currentPage - 1 || 
                           pageNum === currentPage + 1)
                        ) {
                          return (
                            <button
                              key={i}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full ${
                                currentPage === pageNum
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              <span className="text-xs sm:text-sm">{pageNum}</span>
                            </button>
                          );
                        }
                        return null;
                      })}
                      
                      {/* Ellipsis or second-to-last page */}
                      {currentPage < totalPages - 2 && (
                        <span className="text-gray-500">...</span>
                      )}
                      
                      {/* Last page */}
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full ${
                          currentPage === totalPages
                            ? 'bg-amber-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <span className="text-xs sm:text-sm">{totalPages}</span>
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`p-1.5 sm:p-2 rounded-full ${
                      currentPage === totalPages 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="bg-amber-50 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-amber-500" />
                </div>
                <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">No recipes found</h3>
                
                {recipes.length === 0 ? (
                  <>
                    <p className="text-gray-500 mb-6 text-sm sm:text-base">
                      Your collection is empty. Start saving recipes to build your personal cookbook!
                    </p>
                    <a 
                      href="/generate" 
                      className="inline-flex items-center px-3 sm:px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm sm:text-base"
                    >
                      <ChefHat className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Generate Recipes
                    </a>
                  </>
                ) : (
                  <>
                    <p className="text-gray-500 mb-4 text-sm sm:text-base">
                      No recipes match your current filters.
                    </p>
                    <button 
                      onClick={clearFilters}
                      className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
                    >
                      <Filter className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Clear All Filters
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          isLoading={isLoadingRecipe}
        />
      )}
      
      <Footer />
    </div>
  );
};

export default SavedRecipes;