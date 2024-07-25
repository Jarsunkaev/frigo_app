import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDropzone } from "react-dropzone";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../pages/api/firebase";
import { doc, setDoc } from "firebase/firestore";
import axios from "axios";

type Recipe = {
  id: number;
  title: string;
  image: string;
  sourceUrl: string;
};

type RecipeDetails = {
  id: number;
  title: string;
  servings: number;
  readyInMinutes: number;
  image: string;
  instructions: string;
  sourceUrl: string;
};

const Spinner = () => (
  <div className="flex justify-center items-center mt-4">
    <div className="w-16 h-16 border-t-4 border-amber-500 border-solid rounded-full animate-spin"></div>
  </div>
);

function FileUpload() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [identifiedIngredients, setIdentifiedIngredients] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetails | null>(null);
  const [randomFact, setRandomFact] = useState<string>("");
  const [user] = useAuthState(auth);
  const [savedRecipeId, setSavedRecipeId] = useState<number | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchRandomFact() {
      try {
        const response = await axios.get("/api/foodTrivia");
        setRandomFact(response.data.fact);
      } catch (error) {
        console.error("Failed to fetch random fact:", error);
      }
    }
    fetchRandomFact();
  }, []);

  const onDrop = useCallback(async (acceptedFiles) => {
    const image = acceptedFiles[0];
    if (!image) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", image);
      const recognitionResult = await axios.post<string[]>("/api/recognizeIngredients", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setIdentifiedIngredients(recognitionResult.data);
      const response = await axios.post<Recipe[]>("/api/generateRecipe", {
        ingredients: recognitionResult.data,
      });
      setRecipes(response.data);
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setImageSrc(reader.result as string);
        }
      };
      reader.readAsDataURL(image);
    } catch (error) {
      console.error("Failed to generate recipes:", error);
      setError("Failed to generate recipes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleRecipeClick = async (recipeId: number) => {
    try {
      const response = await axios.get<RecipeDetails>(`/api/getRecipeDetails?id=${recipeId}`);
      setSelectedRecipe(response.data);
    } catch (error) {
      console.error("Failed to fetch recipe details:", error);
    }
  };

  const handleSaveRecipe = async (recipe: Recipe) => {
    if (!user) {
      alert("You need to be logged in to save recipes.");
      return;
    }
    try {
      const recipeDoc = doc(db, "users", user.uid, "savedRecipes", recipe.id.toString());
      await setDoc(recipeDoc, {
        id: recipe.id,
        title: recipe.title,
        image: recipe.image,
      });
      setSavedRecipeId(recipe.id);
      setTimeout(() => setSavedRecipeId(null), 3000);
    } catch (error) {
      console.error("Failed to save recipe:", error);
      alert("Failed to save recipe. Please try again.");
    }
  };

  return (
    <>
      <style>{`
        .frosted-glass {
          background: rgba(25, 55, 34, 0.7);
          backdrop-filter: blur(12px);
          border-radius: 20px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
          margin-top: 0; /* Adjusted top margin */
          margin-bottom: 0.5rem; /* Adjusted bottom margin */
        }
        
        .recipe-card {
          background: rgba(252, 249, 237, 0.1);
          backdrop-filter: blur(8px);
          border-radius: 15px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }
        
        .recipe-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 767px) {
          .mobile-no-shadow {
            box-shadow: none !important;
          }
        }
        
        .recipe-button {
          background: transparent;
          border: 2px solid #fcf9ed;
          color: #fcf9ed;
          border-radius: 8px;
          padding: 8px 16px;
          transition: all 0.3s ease;
          margin-bottom: 8px;
          width: 100%;
          cursor: pointer;
        }
        
        .recipe-button:hover {
          background: rgba(252, 249, 237, 0.1);
        }

        .save-popup {
          background: rgba(25, 55, 34, 0.9);
          backdrop-filter: blur(8px);
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        /* Modal styles */
        .modal-content {
          font-size: 1.2rem; /* Increased font size for legibility */
          line-height: 1.6;
          color: #193722;
        }
        
        .modal-title {
          font-size: 1.8rem; /* Larger title font size */
        }
        
        .modal-button {
          cursor: pointer;
          background: transparent;
          border: 2px solid #193722;
          color: #193722;
          border-radius: 8px;
          padding: 8px 16px;
          transition: all 0.3s ease;
          margin-top: 16px;
          width: 100%;
        }
        
        .modal-button:hover {
          background: #193722;
          color: #fcf9ed;
        }
      `}</style>
      <div className="flex justify-center items-start min-h-screen bg-[#fcf9ed] pt-36">
        <div
          ref={menuRef}
          className="max-w-lg w-full p-6 frosted-glass mobile-no-shadow text-white mx-4"
        >
          <div className="pb-4 relative text-center">
            <i className="text-base text-gray-300 mb-4 block">
              Did you know: {randomFact}
            </i>
          </div>

          <div
            {...getRootProps()}
            className={`bg-amber-50 focus:outline-none focus:shadow-outline border-2 border-dashed border-amber-600 rounded-lg py-12 px-4 flex items-center justify-center text-center ${
              isDragActive ? 'bg-amber-100' : ''
            }`}
            style={{ cursor: "pointer" }}
          >
            <input {...getInputProps()} className="hidden" />
            {imageSrc ? (
              <img src={imageSrc} alt="Uploaded" className="w-full h-full object-contain" />
            ) : (
              <p className="text-gray-700">Drag 'n' drop an image here, or click to select one</p>
            )}
          </div>

          {isLoading && <Spinner />}
          {error && <p className="text-center mt-4 text-red-500">{error}</p>}

          {identifiedIngredients.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <h3 className="text-lg font-bold mb-2 w-full">Identified Ingredients:</h3>
              {identifiedIngredients.map((ingredient, index) => (
                <span key={index} className="px-3 py-1 rounded-full text-gray-700 bg-amber-100 border border-amber-500 text-sm">
                  {ingredient}
                </span>
              ))}
            </div>
          )}

          {recipes.length > 0 && (
            <div className="mt-6">
              <h3 className="text-2xl font-bold mb-4">Recipes:</h3>
              <div className="flex flex-col space-y-4">
                {recipes.map((recipe) => (
                  <div key={recipe.id} className="recipe-card overflow-hidden">
                    <div className="p-4">
                      <h4 className="font-bold mb-2">{recipe.title}</h4>
                      <img src={recipe.image} alt={recipe.title} className="w-full max-h-64 object-cover mb-4 rounded-md" />
                      <button
                        className="recipe-button"
                        onClick={() => handleRecipeClick(recipe.id)}
                      >
                        View Recipe
                      </button>
                      <button
                        className="recipe-button"
                        onClick={() => handleSaveRecipe(recipe)}
                      >
                        Save Recipe
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedRecipe && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" onClick={() => setSelectedRecipe(null)}>
          <div 
            className="bg-white bg-opacity-45 backdrop-filter backdrop-blur-lg rounded-3xl shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="modal-title">{selectedRecipe.title}</h2>
              <button 
                onClick={() => setSelectedRecipe(null)}
                className="text-[#193722] hover:text-red-600 transition-colors duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-[#193722] text-xl mb-1">Servings: {selectedRecipe.servings}</p>
            <p className="text-[#193722] text-xl mb-4">Ready in: {selectedRecipe.readyInMinutes} mins</p>
            <h3 className="font-bold text-[#193722] text-2xl mb-2">Instructions:</h3>
            <p className="text-[#193722] text-lg mb-4 whitespace-pre-line">
              {selectedRecipe.instructions.replace(/<[^>]*>/g, '')}
            </p>
            <a
              href={selectedRecipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="modal-button "
            >
              Go to Recipe
            </a>
          </div>
        </div>
      )}

      {savedRecipeId !== null && (
        <div className="fixed top-0 left-0 right-0 flex justify-center items-center p-4 z-50">
          <div className="save-popup text-white px-4 py-2 rounded-full flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Recipe Saved!
          </div>
        </div>
      )}
    </>
  );
}

export default FileUpload;
