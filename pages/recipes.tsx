import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { collection, getDocs } from "firebase/firestore";
import { useRouter } from "next/router";
import axios from "axios";
import { auth, db } from "./api/firebase";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";

type RecipeDetails = {
  id: number;
  title: string;
  servings: number;
  readyInMinutes: number;
  sourceUrl: string;
  image: string;
  instructions: string;
};

function SavedRecipes() {
  const [recipes, setRecipes] = useState<RecipeDetails[]>([]);
  const [user, loading, error] = useAuthState(auth);
  const router = useRouter();
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetails | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    const fetchSavedRecipes = async () => {
      if (user) {
        const savedRecipesCollection = collection(db, "users", user.uid, "savedRecipes");
        const recipeSnapshot = await getDocs(savedRecipesCollection);
        const recipeIds = recipeSnapshot.docs.map(doc => doc.id);

        const recipeDetailsPromises = recipeIds.map(id =>
          axios.get(`/api/getRecipeDetails?id=${id}`)
        );

        const recipeDetails = await Promise.all(recipeDetailsPromises);
        const recipeList = recipeDetails.map(response => response.data as RecipeDetails);
        setRecipes(recipeList);
      }
    };

    fetchSavedRecipes();
  }, [user]);

  const sanitizeInstructions = (instructions: string) => {
    const sanitized = instructions.replace(/<\/?[^>]+(>|$)/g, "");
    return sanitized.replace(/(\r\n|\n|\r){2,}/gm, "\n").trim();
  };

  const openInstructions = (recipe: RecipeDetails) => {
    setSelectedRecipe(recipe);
  };

  const closeInstructions = () => {
    setSelectedRecipe(null);
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="flex min-h-screen flex-col bg-[#fcf9ed] mr-1 ml-1">
      <Header />
      <div className="flex-grow container mx-auto px-4 py-8 mt-32">
        <h1 className="text-3xl font-bold text-center mb-8 text-[#193722]">Saved Recipes</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <div 
              key={recipe.id} 
              className="bg-white bg-opacity-40 backdrop-filter backdrop-blur-md rounded-3xl shadow-lg border-2 border-[#193722] p-6"
            >
              <img src={recipe.image} alt={recipe.title} className="w-full h-48 object-cover rounded-2xl mb-4" />
              <h2 className="text-xl font-bold mb-2 text-[#193722]">{recipe.title}</h2>
              <p className="text-[#193722] mb-1">Servings: {recipe.servings}</p>
              <p className="text-[#193722] mb-4">Ready in: {recipe.readyInMinutes} mins</p>
              
              <button
                onClick={() => openInstructions(recipe)}
                className="w-full py-2 mb-4 bg-transparent text-[#193722] font-bold text-center rounded-lg border-2 border-[#193722] hover:bg-[#193722] hover:text-white transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#193722]"
              >
                Show Instructions
              </button>


              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-2 bg-transparent text-[#193722] font-bold text-center rounded-lg border-2 border-[#193722] hover:bg-[#193722] hover:text-white transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#193722]"
              >
                Go to Recipe ↗️
              </a>
            </div>
          ))}
        </div>
      </div>
      <Footer />

      {selectedRecipe && (
  <div className="fixed inset-0 flex items-center justify-center p-4 z-50" onClick={closeInstructions}>
    <div 
      className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-3xl shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-[#193722]">{selectedRecipe.title}</h2>
        <button 
          onClick={closeInstructions}
          className="text-[#193722] hover:text-red-600 transition-colors duration-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <h3 className="font-bold text-[#193722] mb-2">Instructions:</h3>
      <p className="text-[#193722] text-sm mb-4 whitespace-pre-line">
        {sanitizeInstructions(selectedRecipe.instructions)}
      </p>
    </div>
  </div>
)}
    </div>
  );
}

export default SavedRecipes;