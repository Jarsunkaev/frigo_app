// pages/recipes.tsx - Enhanced with better UI
import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
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
  Leaf
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
  const [searchQuery, setSearchQuery] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sortOption, setSortOption] = useState<'newest' | 'time' | 'alphabetical'>('newest');
  const [filterDiet, setFilterDiet] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
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
  };

  const RecipeCard = ({ recipe }: { recipe: RecipeDetails }) => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1">
      <div className="relative h-48">
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
          <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs">
            Vegetarian
          </div>
        )}
        
        {recipe.readyInMinutes && recipe.readyInMinutes <= 30 && (
          <div className="absolute top-4 right-4 bg-amber-500 text-white p-2 rounded-full">
            <Clock className="w-4 h-4" />
          </div>
        )}
      </div>
      
      <div className="p-6">
        <h3 className="font-bold text-xl mb-4 text-gray-800 line-clamp-2">{recipe.title}</h3>
        
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center text-gray-600">
            <Clock className="w-4 h-4 mr-1" />
            <span className="text-sm">{recipe.readyInMinutes || 30}min</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Users className="w-4 h-4 mr-1" />
            <span className="text-sm">{recipe.servings || 4} servings</span>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => handleViewRecipe(recipe)}
            className="w-full py-2.5 bg-amber-500 text-white rounded-lg font-semibold 
                     hover:bg-amber-600 transition-colors duration-300"
          >
            View Recipe
          </button>

          {recipe.sourceUrl && (
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 flex items-center justify-center gap-2 bg-gray-50 
                       text-gray-700 rounded-lg font-semibold hover:bg-gray-100 
                       transition-colors duration-300"
            >
              <span>View Original</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );

  const RecipeListItem = ({ recipe }: { recipe: RecipeDetails }) => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl p-4 flex flex-col sm:flex-row gap-4">
      <div className="relative h-24 sm:h-auto sm:w-32 shrink-0">
        <img 
          src={recipe.image} 
          alt={recipe.title} 
          className="w-full h-full object-cover rounded-lg"
          onError={(e) => {
            e.currentTarget.src = "https://via.placeholder.com/400x300?text=Recipe+Image";
          }}
        />
      </div>
      
      <div className="flex-grow">
        <h3 className="font-bold text-xl mb-2 text-gray-800">{recipe.title}</h3>
        
        <div className="flex flex-wrap gap-4 mb-2">
          <div className="flex items-center text-gray-600">
            <Clock className="w-4 h-4 mr-1" />
            <span className="text-sm">{recipe.readyInMinutes || 30}min</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Users className="w-4 h-4 mr-1" />
            <span className="text-sm">{recipe.servings || 4} servings</span>
          </div>
          {recipe.diets && recipe.diets.length > 0 && (
            <div className="flex items-center text-green-600">
              <Leaf className="w-4 h-4 mr-1" />
              <span className="text-sm">{recipe.diets[0]}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex sm:flex-col gap-2 shrink-0 self-end sm:self-center">
        <button
          onClick={() => handleViewRecipe(recipe)}
          className="px-4 py-2 bg-amber-500 text-white rounded-lg font-semibold 
                   hover:bg-amber-600 transition-colors duration-300 text-sm"
        >
          View
        </button>

        {recipe.sourceUrl && (
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 flex items-center justify-center gap-1 bg-gray-50 
                     text-gray-700 rounded-lg font-semibold hover:bg-gray-100 
                     transition-colors duration-300 text-sm"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
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
      
      <main className="flex-grow container mx-auto px-4 py-16 pt-24">
        <div className="max-w-6xl mx-auto">
          {/* Page header with title and description */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Your Recipe Collection</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              All your saved recipes in one place. Browse, search, and organize your culinary inspirations.
            </p>
          </div>
          
          {/* Search and filter bar */}
          <div className="bg-white rounded-xl shadow-lg p-4 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search input */}
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search your recipes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
              
              {/* Sort dropdown */}
              <div className="flex-shrink-0">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as any)}
                  className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
                >
                  <option value="newest">Newest First</option>
                  <option value="time">Quick Recipes First</option>
                  <option value="alphabetical">Alphabetical (A-Z)</option>
                </select>
              </div>
              
              {/* Diet filter dropdown */}
              <div className="flex-shrink-0">
                <select
                  value={filterDiet || ""}
                  onChange={(e) => setFilterDiet(e.target.value || null)}
                  className="px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
                >
                  <option value="">All Diets</option>
                  {allDietTypes.map(diet => (
                    <option key={diet} value={diet}>{diet}</option>
                  ))}
                </select>
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
                    <div className="w-2 h-2 bg-current rounded-sm"></div>
                    <div className="w-2 h-2 bg-current rounded-sm"></div>
                    <div className="w-2 h-2 bg-current rounded-sm"></div>
                    <div className="w-2 h-2 bg-current rounded-sm"></div>
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
            </div>
            
            {/* Active filters display */}
            {(searchQuery || filterDiet || sortOption !== 'newest') && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-500">Active filters:</span>
                
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
              <AlertCircle className="w-5 h-5 mr-2" />
              <p>{loadError}</p>
            </div>
          )}

          {/* Recipe count and stats */}
          {filteredRecipes.length > 0 && (
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                Showing {paginatedRecipes.length} of {filteredRecipes.length} recipes
              </p>
              
              {recipes.length > 0 && (
                <div className="bg-amber-50 px-3 py-1 rounded-lg text-amber-700 text-sm flex items-center">
                  <Heart className="w-4 h-4 mr-1 fill-amber-500 stroke-amber-500" />
                  <span>{recipes.length} saved recipes</span>
                </div>
              )}
            </div>
          )}

          {/* Recipes display */}
          {filteredRecipes.length > 0 ? (
            <>
              {view === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedRecipes.map((recipe) => (
                    <RecipeCard key={recipe.id} recipe={recipe} />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {paginatedRecipes.map((recipe) => (
                    <RecipeListItem key={recipe.id} recipe={recipe} />
                  ))}
                </div>
              )}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-full ${
                      currentPage === 1 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-full ${
                        currentPage === i + 1
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-full ${
                      currentPage === totalPages 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="bg-amber-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-amber-500" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No recipes found</h3>
                
                {recipes.length === 0 ? (
                  <>
                    <p className="text-gray-500 mb-6">
                      Your collection is empty. Start saving recipes to build your personal cookbook!
                    </p>
                    <a 
                      href="/generate" 
                      className="inline-flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                    >
                      <ChefHat className="w-5 h-5 mr-2" />
                      Generate Recipes
                    </a>
                  </>
                ) : (
                  <>
                    <p className="text-gray-500 mb-4">
                      No recipes match your current filters.
                    </p>
                    <button 
                      onClick={clearFilters}
                      className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Filter className="w-5 h-5 mr-2" />
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