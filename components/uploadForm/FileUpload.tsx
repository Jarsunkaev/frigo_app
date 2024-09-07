import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from "react-dropzone";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../pages/api/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Heart } from 'lucide-react';
import axios from "axios";
import { getUserData, decrementGenerations, resetGenerations } from '../../pages/api/firebase';

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
  extendedIngredients: Array<{ original: string }>;
};

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
  const [newIngredient, setNewIngredient] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [localImageUrl, setLocalImageUrl] = useState<string | any>(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = useCallback(async () => {
    if (user) {
      try {
        const data = await getUserData(user.uid);
        console.log("Fetched user data:", data);  // Log the fetched data
        setUserData(data);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to fetch user data. Please try again.");
      }
    }
  }, [user]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);


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

  const processImage = async (image: File) => {
    if (!user) {
      alert("You need to be logged in to generate recipes.");
      return;
    }

    const canGenerate = await decrementGenerations(user.uid);
    if (!canGenerate) {
      alert("You've used all your recipe generations for this month. Please upgrade to premium for more.");
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
    } catch (error) {
      console.error("Failed to process image:", error);
      setError("Failed to process image. Please try again.");
    } finally {
      setIsLoading(false);
      fetchUserData(); // Refresh user data after generation
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const image = acceptedFiles[0];
    if (!image) return;

    setImageFile(image);
    const localUrl = URL.createObjectURL(image);
    setLocalImageUrl(localUrl);
    setImageSrc(null);
    processImage(image);
  }, []);

  useEffect(() => {
    return () => {
      if (localImageUrl) {
        URL.revokeObjectURL(localImageUrl);
      }
    };
  }, [localImageUrl]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {'image/*': []},
    multiple: false
  });

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

  const handleDeleteIngredient = (ingredient: string) => {
    setIdentifiedIngredients(identifiedIngredients.filter(item => item !== ingredient));
  };

  const handleAddIngredient = () => {
    if (newIngredient.trim() !== '') {
      setIdentifiedIngredients(prevIngredients => [...prevIngredients, newIngredient.trim()]);
      setNewIngredient('');
    }
  };

  const handleGenerateRecipes = async () => {
    if (!user) {
      alert("You need to be logged in to generate recipes.");
      return;
    }

    if (!userData) {
      alert("Unable to fetch user data. Please try again.");
      return;
    }

    if (userData.generationsLeft <= 0) {
      alert("You've used all your recipe generations for this month. Please upgrade to premium for more.");
      return;
    }

    if (identifiedIngredients.length === 0) {
      alert("Please add some ingredients first.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const canGenerate = await decrementGenerations(user.uid);
      if (!canGenerate) {
        throw new Error("Failed to decrement generations. Please try again.");
      }

      const recipeCount = userData.subscriptionTier === 'premium' ? 15 : 6;
      console.log(`Generating ${recipeCount} recipes for ${userData.subscriptionTier} user`);

      const response = await axios.post("/api/generateRecipe", {
        ingredients: identifiedIngredients,
        count: recipeCount
      });

      setRecipes(response.data);
    } catch (error) {
      console.error("Failed to generate recipes:", error);
      setError("Failed to generate recipes. Please try again.");
    } finally {
      setIsLoading(false);
      fetchUserData();  // Refresh user data after generation
    }
  };

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

        .modal-overlay {
          z-index: 1000;
        }

        .notification {
          z-index: 1001;
        }

        .frosted-glass {
          background: rgba(25, 55, 34, 0.7);
          backdrop-filter: blur(12px);
          border-radius: 20px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
        }
        
        .recipe-card {
          background: rgba(252, 249, 237, 0.4);
          backdrop-filter: blur(8px);
          border-radius: 15px;
          border: 2px solid rgba(25, 55, 34, 0.3);
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        
        .recipe-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .recipe-image-container {
          position: relative;
          width: 100%;
          padding-top: 75%;
          overflow: hidden;
        }

        .recipe-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
  
        .elegant-button {
          background: transparent;
          border: 2px solid #193722;
          color: #193722;
          font-weight: bold;
          border-radius: 8px;
          padding: 10px 20px;
          transition: all 0.3s ease;
        }

        .ingredient-pill {
          display: inline-flex;
          align-items: center;
          background: rgba(25, 55, 34, 0.1);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(25, 55, 34, 0.5);
          border-radius: 15px;
          padding: 6px 12px;
          margin: 4px;
          font-size: 0.875rem;
          color: #193722;
          transition: all 0.3s ease;
        }

        .ingredient-pill:hover {
          background: rgba(25, 55, 34, 0.2);
          border-color: rgba(25, 55, 34, 0.8);
        }

        .ingredient-pill button {
          background: transparent;
          border: none;
          color: #193722;
          font-size: 1.25rem;
          cursor: pointer;
          margin-left: 8px;
          transition: color 0.3s ease;
        }

        .ingredient-pill button:hover {
          color: #ff6b6b;
        }
      
        .elegant-button:hover {
          background: #193722;
          color: #fcf9ed;
        }

        .add-ingredient-button {
          background: #193722;
          color: #fcf9ed;
          border: none;
          font-weight: bold;
          border-radius: 0 8px 8px 0;
          padding: 10px 20px;
          transition: all 0.3s ease;
        }
      
        .add-ingredient-button:hover {
          background: #254b2d;
        }

        .drag-drop-zone {
          background: rgba(25, 55, 34, 0.1);
          backdrop-filter: blur(8px);
          border: 2px dashed rgba(25, 55, 34, 0.5);
          border-radius: 14px;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .drag-drop-zone:hover, .drag-drop-zone.active {
          background: rgba(25, 55, 34, 0.2);
          border-color: rgba(25, 55, 34, 0.8);
        }

        .drag-drop-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          border-radius: 14px;
          width: 100%;
          height: 100%;
        }

        .uploaded-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: scale-down;
        }

        .generate-button {
          background: #193722;
          color: #fcf9ed;
          border: none;
          font-weight: bold;
          border-radius: 8px;
          padding: 12px 24px;
          transition: all 0.3s ease;
          width: 60%;
          margin: 0 auto;
          display: block;
        }
      
        .generate-button:hover {
          background: #254b2d;
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .content-wrapper {
          padding-top: 6rem;
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        @media (min-width: 640px) {
          .content-wrapper {
            padding-top: 8rem;
          }
        }
          .recipe-generator {
          margin-top: 2rem;
          width: 100%;
          max-width: 2xl;
        }
        .heart-button {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>

      <div className="flex justify-start items-start min-h-screen p-4 mt-2 mb-20 bg-[#fcf9ed] content-wrapper">
        <div className="bg-white bg-opacity-40 backdrop-filter backdrop-blur-md p-6 rounded-3xl shadow-lg w-full max-w-2xl border-2 border-[#193722] recipe-generator">
          <h2 className="text-2xl font-bold mb-4 text-[#193722]">Recipe Generator</h2>
          <p className="text-[#193722] mb-4">{randomFact}</p>

          {userData && (
        <div className="bg-[#193722] text-white rounded-[14px] p-3 shadow-md flex items-center justify-between mb-4">
          <span className="font-semibold">Generations left this month:</span>
          <span className="bg-white text-[#193722] rounded-full px-3 py-1 font-bold">
            {userData.generationsLeft}
          </span>
        </div>
      )}

          <div
            {...getRootProps()}
            className={`drag-drop-zone ${isDragActive ? 'active' : ''} mb-6 cursor-pointer`}
            style={{ height: localImageUrl || imageSrc ? '250px' : '150px' }}
          >
            <input {...getInputProps()} />
            <div className="drag-drop-content">
              {localImageUrl || imageSrc ? (
                <img 
                  src={localImageUrl || imageSrc}
                  alt="Uploaded" 
                  className="uploaded-image" 
                />
              ) : (
                <>
                  <span className="block text-3xl mb-2"></span>
                  <p className="text-[#193722]">
                    Upload or take a picture of your ingredients
                  </p>
                </>
              )}
            </div>
          </div>
      
          {isLoading && <Spinner />}
          {error && <p className="text-center mt-4 text-red-600">{error}</p>}

          {identifiedIngredients.length > 0 && (
            <div className="mt-4 mb-6">
              <h3 className="text-lg font-bold mb-2 text-[#193722]">Identified Ingredients:</h3>
              <div className="flex flex-wrap justify-center">
                {identifiedIngredients.map((ingredient, index) => (
                  <div key={index} className="ingredient-pill">
                    {ingredient}
                    <button onClick={() => handleDeleteIngredient(ingredient)} className="ml-2 text-sm">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 mb-8">
            <div className="flex">
              <input
                type="text"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                placeholder="Add new ingredient"
                className="w-full px-4 py-2 border-2 border-r-0 border-[#193722] rounded-l-lg text-[#193722] bg-white bg-opacity-50"
              />
              <button onClick={handleAddIngredient} className="add-ingredient-button">
                Add
              </button>
            </div>
          </div>

          <button onClick={handleGenerateRecipes} className="generate-button">
            Generate Recipes
          </button>

          {recipes.length > 0 && (
            <div className="mt-8">
              <h3 className="text-2xl font-bold mb-4 text-[#193722]">Recipes:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {recipes.map((recipe) => (
                  <div key={recipe.id} className="recipe-card overflow-hidden">
                    <div className="p-4 flex flex-col h-full">
                      <h4 className="font-bold mb-2 text-[#193722]">{recipe.title}</h4>
                      <div className="recipe-image-container mb-4">
                        <img src={recipe.image} alt={recipe.title} className="recipe-image rounded-lg" />
                      </div>
                      <div className="flex justify-between mt-auto">
                        <button
                          className="elegant-button flex-2 mr-2"
                          onClick={() => handleRecipeClick(recipe.id)}
                        >
                          View Recipe
                        </button>
                        <button
                          className="heart-button flex-1"
                          onClick={() => handleSaveRecipe(recipe)}
                          aria-label={savedRecipeId === recipe.id ? "Unsave recipe" : "Save recipe"}
                        >
                          <Heart
                            fill={savedRecipeId === recipe.id ? "#ff0000" : "none"}
                            stroke={savedRecipeId === recipe.id ? "#ff0000" : "#193722"}
                            size={30}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal for selected recipe details */}
      {selectedRecipe && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black bg-opacity-50 modal-overlay" onClick={() => setSelectedRecipe(null)}>
          <div 
            className="bg-white bg-opacity-95 backdrop-filter backdrop-blur-lg rounded-3xl shadow-lg p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Recipe details content */}
          </div>
        </div>
      )}

      {/* Notification for saved recipe */}
      {savedRecipeId !== null && (
        <div className="fixed top-0 left-0 right-0 flex justify-center items-center p-4 notification">
          <div className="bg-[#193722] text-white px-4 py-2 rounded-full flex items-center">
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