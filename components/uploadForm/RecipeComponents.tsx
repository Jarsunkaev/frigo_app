
// components/RecipeCard.tsx - fixed version to handle undefined values

import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { 
  doc, 
  setDoc, 
  getFirestore, 
  serverTimestamp,
  deleteDoc
} from "firebase/firestore";
import { auth } from '../../pages/api/firebase';
import { 
  Heart, 
  Clock, 
  Users, 
  ExternalLink, 
  Crown,
  Lock,
  ChevronRight,
  Loader,
  X
} from 'lucide-react';

interface RecipeProps {
  id: number;
  title: string;
  image: string;
  readyInMinutes?: number;
  servings?: number;
  sourceUrl?: string;
  diets?: string[];
  analyzedInstructions?: any[];
  extendedIngredients?: any[];
  instructions?: string;
  isPremiumOnly?: boolean;
}

interface RecipeCardProps {
  recipe: RecipeProps;
  onView: (recipe: RecipeProps) => void;
  onSave?: (recipe: RecipeProps) => void;
  isSaved?: boolean;
  isPremium?: boolean;
  userSubscriptionTier?: 'free' | 'premium';
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onView,
  onSave,
  isSaved: initialIsSaved = false,
  isPremium = false,
  userSubscriptionTier = 'free'
}) => {
  const [user] = useAuthState(auth);
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [isSaving, setIsSaving] = useState(false);
  
  const isLocked = isPremium && userSubscriptionTier === 'free';
  const db = getFirestore();

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLocked || !user) return;
    
    try {
      setIsSaving(true);
      
      if (isSaved) {
        // Remove from saved recipes
        const savedRecipeRef = doc(db, "users", user.uid, "savedRecipes", recipe.id.toString());
        await deleteDoc(savedRecipeRef);
        setIsSaved(false);
        console.log("Recipe removed from saved recipes");
        
        // Call the onSave callback if provided
        if (onSave) {
          onSave(recipe);
        }
      } else {
        // Save recipe to user's saved recipes collection
        // Create a clean object with no undefined values
        const recipeData = {
          id: recipe.id,
          title: recipe.title || "",
          image: recipe.image || "",
          readyInMinutes: recipe.readyInMinutes || 0, // Use 0 instead of undefined
          servings: recipe.servings || 0, // Use 0 instead of undefined
          sourceUrl: recipe.sourceUrl || "",
          diets: recipe.diets || [],
          savedAt: serverTimestamp(),
        };
        
        const savedRecipeRef = doc(db, "users", user.uid, "savedRecipes", recipe.id.toString());
        await setDoc(savedRecipeRef, recipeData);
        setIsSaved(true);
        console.log("Recipe saved successfully");
        
        // Call the onSave callback if provided
        if (onSave) {
          onSave(recipe);
        }
      }
    } catch (error) {
      console.error("Error saving recipe:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 
      ${isLocked ? 'opacity-90' : 'hover:shadow-xl transform hover:-translate-y-1'}`}>
      <div className="relative h-48">
        <img 
          src={recipe.image} 
          alt={recipe.title} 
          className={`w-full h-full object-cover ${isLocked ? 'filter blur-sm' : ''}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {isPremium && (
          <div className="absolute top-4 left-4 bg-amber-500 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm">
            <Crown className="w-4 h-4" />
            <span>Premium</span>
          </div>
        )}

        {user && (
          <button
            onClick={handleSaveClick}
            className={`absolute top-4 right-4 p-2 rounded-full bg-white/90 shadow-lg transition-all duration-300 
              ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white'}
              ${isSaving ? 'animate-pulse' : ''}`}
            disabled={isLocked || isSaving}
          >
            <Heart 
              className={`w-6 h-6 ${isSaved ? 'fill-red-500 stroke-red-500' : 'stroke-gray-600'}`}
            />
          </button>
        )}

        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="text-center p-4 rounded-lg">
              <Lock className="w-8 h-8 text-white mx-auto mb-2" />
              <p className="text-white text-sm font-medium mb-1">Premium Recipe</p>
              <a 
                href="/subscription"
                className="text-amber-400 hover:text-amber-300 text-sm underline"
                onClick={(e) => e.stopPropagation()}
              >
                Upgrade to Access
              </a>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-6">
        <h3 className="font-bold text-xl mb-4 text-gray-800 line-clamp-2">
          {recipe.title}
        </h3>
        
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center text-gray-600">
            <Clock className="w-4 h-4 mr-1" />
            <span className="text-sm">{recipe.readyInMinutes || '30'}min</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Users className="w-4 h-4 mr-1" />
            <span className="text-sm">{recipe.servings || '4'} servings</span>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => !isLocked && onView(recipe)}
            className={`w-full py-2.5 rounded-lg font-semibold transition-colors duration-300
              ${isLocked 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : 'bg-amber-500 text-white hover:bg-amber-600'}`}
            disabled={isLocked}
          >
            {isLocked ? 'Premium Only' : 'View Recipe'}
          </button>

          {recipe.sourceUrl && !isLocked && (
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
};

const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-8">
    <Loader className="w-8 h-8 text-amber-500 animate-spin" />
  </div>
);

const cleanInstructions = (instructions: string | undefined): string[] => {
  if (!instructions) return [];
  let cleaned = instructions.replace(/<[^>]*>/g, '');
  cleaned = cleaned.replace(/\*\*\d+\*\*/g, '');
  return cleaned
    .split('.')
    .map(step => step.trim())
    .filter(step => step.length > 0 && !step.match(/^\d+$/));
};

interface RecipeModalProps {
  recipe: RecipeProps;
  onClose: () => void;
  isLoading: boolean;
  isPremium?: boolean;
  userSubscriptionTier?: 'free' | 'premium';
}

export const RecipeModal: React.FC<RecipeModalProps> = ({
  recipe,
  onClose,
  isLoading,
  isPremium = false,
  userSubscriptionTier = 'free'
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [viewMode, setViewMode] = useState<'full' | 'steps'>('full');
  const isLocked = isPremium && userSubscriptionTier === 'free';

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!recipe) return null;

  if (isLocked) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="min-h-screen px-4 text-center">
          <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
          <div className="inline-block w-full max-w-md p-6 my-8 text-center align-middle bg-white shadow-xl rounded-2xl">
            <Crown className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Premium Recipe</h2>
            <p className="text-gray-600 mb-6">
              Upgrade to Premium to unlock this recipe and access all premium features.
            </p>
            <div className="space-y-3">
              <a 
                href="/subscription"
                className="block w-full py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-colors"
              >
                Upgrade to Premium
              </a>
              <button
                onClick={onClose}
                className="block w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Correctly combine analyzed instructions with fallback to raw instructions
  const steps = recipe.analyzedInstructions?.[0]?.steps?.map((step: { step: string }) => step.step)
                || cleanInstructions(recipe.instructions);
  const hasInstructions = steps.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="min-h-screen px-4 text-center">
        <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
        
        <div 
          className="inline-block w-full max-w-2xl p-0 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-20 p-2 rounded-full bg-white/90 hover:bg-white transition-colors duration-200 shadow-sm"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          <div className="relative h-48">
            <img
              src={recipe.image}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>

          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{recipe.title}</h2>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-amber-50 rounded-xl p-4 flex items-center gap-3">
                <Clock className="w-6 h-6 text-amber-500" />
                <div>
                  <p className="text-sm text-gray-600">Time</p>
                  <p className="font-semibold">{recipe.readyInMinutes || '30'} mins</p>
                </div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 flex items-center gap-3">
                <Users className="w-6 h-6 text-amber-500" />
                <div>
                  <p className="text-sm text-gray-600">Servings</p>
                  <p className="font-semibold">{recipe.servings || '4'}</p>
                </div>
              </div>
            </div>

            {recipe.diets && recipe.diets.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Dietary Info</h3>
                <div className="flex flex-wrap gap-2">
                  {recipe.diets.map((diet, index) => (
                    <span key={index} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                      {diet}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Ingredients</h3>
              <div className="bg-gray-50 rounded-xl p-6">
                {isLoading ? (
                  <LoadingSpinner />
                ) : (recipe.extendedIngredients ?? []).length > 0 ? (
                  <ul className="space-y-3">
                    {(recipe.extendedIngredients ?? []).map((ingredient, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-gray-700">{ingredient.original}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center text-gray-500">No ingredients information available</p>
                )}
              </div>
            </div>

            {/* Instructions Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Instructions</h3>
                {hasInstructions && !isLoading && (
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('full')}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 
                        ${viewMode === 'full' 
                          ? 'bg-white text-amber-500 shadow-sm' 
                          : 'text-gray-600 hover:text-amber-500'}`}
                    >
                      Full Recipe
                    </button>
                    <button
                      onClick={() => setViewMode('steps')}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 
                        ${viewMode === 'steps' 
                          ? 'bg-white text-amber-500 shadow-sm' 
                          : 'text-gray-600 hover:text-amber-500'}`}
                    >
                      Step by Step
                    </button>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 rounded-xl p-6">
                {isLoading ? (
                  <LoadingSpinner />
                ) : !hasInstructions ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No instructions available</p>
                    {recipe.sourceUrl && (
                      <p className="mt-2 text-sm text-gray-500">
                        Please check the original recipe for instructions
                      </p>
                    )}
                  </div>
                ) : viewMode === 'full' ? (
                  <div className="space-y-4">
                    {steps.map((step: string, index: number) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                          <span className="text-amber-600 font-semibold">{index + 1}</span>
                        </div>
                        <p className="text-gray-700 flex-grow pt-1">{step}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                        disabled={currentStep === 0}
                        className={`p-2 rounded ${
                          currentStep === 0 ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <ChevronRight className="w-5 h-5 rotate-180" />
                      </button>
                      <span className="text-sm text-gray-500">
                        Step {currentStep + 1} of {steps.length}
                      </span>
                      <button
                        onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
                        disabled={currentStep === steps.length - 1}
                        className={`p-2 rounded ${
                          currentStep === steps.length - 1
                            ? 'text-gray-300'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="relative bg-white rounded-lg p-4 shadow-sm">
                      <div className="absolute bottom-0 left-0 h-1 w-full bg-gray-200">
                        <div
                          className="h-full bg-amber-500 transition-all duration-300"
                          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                        />
                      </div>
                      <p className="text-gray-700 whitespace-pre-line min-h-[60px]">
                        {steps[currentStep]}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {recipe.sourceUrl && (
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 bg-amber-500 text-white rounded-xl font-semibold 
                         hover:bg-amber-600 transition-colors duration-300 text-center"
              >
                View Original Recipe
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
