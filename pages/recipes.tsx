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
  extendedIngredients?: { original: string }[];
};

const Spinner = () => (
  <div className="flex justify-center items-center mt-4">
    <svg className="w-16 h-16" viewBox="0 0 50 50">
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="#e6f4ea"
        strokeWidth="4"
      />
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="#193722"
        strokeWidth="4"
        strokeDasharray="31.4 31.4"
        strokeLinecap="round"
        transform="rotate(-90 25 25)"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 25 25"
          to="360 25 25"
          dur="1s"
          repeatCount="indefinite"
        />
      </circle>
      <path
        d="M25 15 L25 20 M25 30 L25 35 M15 25 L20 25 M30 25 L35 25"
        stroke="#193722"
        strokeWidth="4"
        strokeLinecap="round"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 25 25"
          to="360 25 25"
          dur="6s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  </div>
);

function SavedRecipes() {
  const [recipes, setRecipes] = useState<RecipeDetails[]>([]);
  const [user, loading, error] = useAuthState(auth);
  const router = useRouter();
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    const fetchSavedRecipes = async () => {
      if (user) {
        setIsLoading(true);
        const savedRecipesCollection = collection(db, "users", user.uid, "savedRecipes");
        const recipeSnapshot = await getDocs(savedRecipesCollection);
        const recipeIds = recipeSnapshot.docs.map(doc => doc.id);

        const recipeDetailsPromises = recipeIds.map(id =>
          axios.get(`/api/getRecipeDetails?id=${id}`)
        );

        const recipeDetails = await Promise.all(recipeDetailsPromises);
        const recipeList = recipeDetails.map(response => response.data as RecipeDetails);
        setRecipes(recipeList);
        setIsLoading(false);
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

  if (loading || isLoading) return <Spinner />;
  if (!user) return <div>Loading...</div>;

  return (
    <>

      <style>{`
        .modal-content {
          scrollbar-width: thin;
          scrollbar-color: rgba(25, 55, 34, 0.2) transparent;
        }

        .modal-content::-webkit-scrollbar {
          width: 8px;
        }

        .modal-content::-webkit-scrollbar-track {
          background: transparent;
        }

        .modal-content::-webkit-scrollbar-thumb {
          background-color: rgba(25, 55, 34, 0.2);
          border-radius: 20px;
          border: transparent;
        }
      `}</style>
      <div className="flex min-h-screen flex-col bg-[#fcf9ed]">
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
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black bg-opacity-50" onClick={closeInstructions}>
            <div 
              className="bg-white bg-opacity-95 backdrop-filter backdrop-blur-lg rounded-3xl shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto modal-content"
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
              <img src={selectedRecipe.image} alt={selectedRecipe.title} className="w-full h-48 object-cover rounded-lg mb-4" />
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-[#193722] bg-opacity-10 p-3 rounded-lg">
                  <p className="text-[#193722] text-lg font-semibold">Servings</p>
                  <p className="text-[#193722] text-xl">{selectedRecipe.servings}</p>
                </div>
                <div className="bg-[#193722] bg-opacity-10 p-3 rounded-lg">
                  <p className="text-[#193722] text-lg font-semibold">Cooking Time</p>
                  <p className="text-[#193722] text-xl">{selectedRecipe.readyInMinutes} mins</p>
                </div>
              </div>
              <div className="mb-6">
                <h3 className="font-bold text-[#193722] text-xl mb-2">Ingredients:</h3>
                {selectedRecipe.extendedIngredients && selectedRecipe.extendedIngredients.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {selectedRecipe.extendedIngredients.map((ingredient, index) => (
                      <li key={index} className="text-[#193722] text-lg mb-1">{ingredient.original}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[#193722] text-lg">Ingredients information not available.</p>
                )}
              </div>
              <div className="mb-6">
                <h3 className="font-bold text-[#193722] text-xl mb-2">Instructions:</h3>
                <p className="text-[#193722] text-lg whitespace-pre-line">
                  {sanitizeInstructions(selectedRecipe.instructions)}
                </p>
              </div>
              <a
                href={selectedRecipe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-2 bg-transparent text-[#193722] font-bold text-center rounded-lg border-2 border-[#193722] hover:bg-[#193722] hover:text-white transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#193722]" 
              >
                Go to Recipe
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default SavedRecipes;