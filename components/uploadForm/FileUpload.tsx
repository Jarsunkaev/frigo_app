import React, { useState, useCallback, useEffect, FormEvent } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, getUserSubscriptionStatus } from '../../pages/api/firebase';
import { Camera, Plus, X, ChefHat, Check, AlertCircle, Crown, Lock } from 'lucide-react';
import { useSubscription } from '../../hooks/useSubscription';

const Spinner: React.FC = () => (
  <div className="flex justify-center items-center my-6">
    <div className="relative h-16 w-16">
      <div className="absolute inset-0 animate-spin">
        <div className="h-full w-full rounded-full border-4 border-t-amber-500 border-r-transparent border-b-amber-500 border-l-transparent"></div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <ChefHat className="text-amber-500" size={20} />
      </div>
    </div>
  </div>
);

interface AlertProps {
  type: 'error' | 'success' | 'info' | 'warning';
  message: string;
  onClose?: () => void;
}

const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
  const colors = {
    error: 'bg-red-50 text-red-700 border-red-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200'
  };

  return (
    <div className={`rounded-lg p-4 mb-4 flex items-center justify-between ${colors[type]} border`}>
      <div className="flex items-center gap-2">
        {type === 'error' && <AlertCircle className="h-5 w-5 flex-shrink-0" />}
        {type === 'success' && <Check className="h-5 w-5 flex-shrink-0" />}
        {type === 'warning' && <AlertCircle className="h-5 w-5 flex-shrink-0" />}
        <p className="text-sm">{message}</p>
      </div>
      {onClose && (
        <button 
          onClick={onClose} 
          className="p-1.5 hover:bg-black/5 rounded-full transition-colors flex-shrink-0"
          aria-label="Close alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

interface IngredientTagProps {
  ingredient: string;
  onDelete: (ingredient: string) => void;
}

const IngredientTag: React.FC<IngredientTagProps> = ({ ingredient, onDelete }) => (
  <div className="inline-flex items-center bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
    <span className="text-amber-800 text-sm max-w-[150px] truncate">{ingredient}</span>
    <button
      onClick={() => onDelete(ingredient)}
      className="ml-1.5 p-1 -mr-1 text-amber-600 hover:text-amber-800 hover:bg-amber-100/50 rounded-full transition-colors"
      aria-label={`Remove ${ingredient}`}
    >
      <X size={14} />
    </button>
  </div>
);

interface SubscriptionBannerProps {
  status: {
    subscriptionTier: string;
    limits: {
      remainingGenerations: number;
      maxGenerations: number;
      maxSuggestions: number;
    };
  } | null;
}

const SubscriptionBanner: React.FC<SubscriptionBannerProps> = ({ status }) => {
  if (!status) return null;

  const { subscriptionTier, limits } = status;
  const isPremium = subscriptionTier === 'premium';

  return (
    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
        <div className="flex items-center gap-2 mb-2 sm:mb-0">
          {isPremium ? <Crown className="w-5 h-5 text-amber-600" /> : null}
          <span className="font-medium text-amber-800">
            {isPremium ? 'Premium Plan' : 'Free Plan'}
          </span>
        </div>
        <span className="text-sm text-amber-700">
          {limits.remainingGenerations} of {limits.maxGenerations} generation{limits.maxGenerations !== 1 ? 's' : ''} left today
        </span>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-amber-600">
        <span>
          {isPremium 
            ? 'Up to 25 recipe suggestions per generation' 
            : 'Up to 6 recipe suggestions per generation'}
        </span>
        {!isPremium && (
          <a href="/subscription" className="text-amber-700 hover:text-amber-800 font-medium mt-2 sm:mt-0">
            Upgrade →
          </a>
        )}
      </div>
    </div>
  );
};

interface FileUploadProps {
  onRecipesGenerated?: (data: any) => void;
  setIsLoading?: (loading: boolean) => void;
  subscriptionStatus?: SubscriptionBannerProps['status'] | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ onRecipesGenerated, setIsLoading: setParentLoading, subscriptionStatus: initialSubscriptionStatus }) => {
  const [user] = useAuthState(auth);
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newIngredient, setNewIngredient] = useState('');
  const [alert, setAlert] = useState<AlertProps | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionBannerProps['status']>(initialSubscriptionStatus || null);
  const { isPremium, subscription, loading: subLoading, refreshSubscription } = useSubscription();

  // Use the actual subscription status returned by getUserSubscriptionStatus
  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (user) {
        try {
          const status = await getUserSubscriptionStatus(user.uid);
          setSubscriptionStatus({
            subscriptionTier: status.subscriptionTier,
            limits: status.limits
          });
        } catch (error) {
          console.error('Error fetching subscription status:', error);
        }
      }
    };

    fetchSubscriptionStatus();
  }, [user]);

  // Update subscription status when initialSubscriptionStatus changes
  useEffect(() => {
    if (initialSubscriptionStatus) {
      setSubscriptionStatus(initialSubscriptionStatus);
    }
  }, [initialSubscriptionStatus]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) {
      setAlert({
        type: 'error',
        message: 'Please sign in to use this feature'
      });
      return;
    }

    // Check if user has remaining generations before uploading
    if (subscriptionStatus?.limits?.remainingGenerations !== undefined && subscriptionStatus.limits.remainingGenerations <= 0) {
      setAlert({
        type: 'warning',
        message: subscriptionStatus.subscriptionTier === 'premium'
          ? 'Daily generation limit reached. Try again tomorrow!'
          : 'Daily generation limit reached. Upgrade to premium for more generations!'
      });
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAlert({ type: 'error', message: 'Please upload an image file' });
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setImage(file);
    setUploadProgress(0);
    setIngredients([]);

    try {
      setIsLoading(true);
      if (setParentLoading) setParentLoading(true);
      
      const formData = new FormData();
      formData.append('image', file);

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => (prev >= 90 ? 90 : prev + 10));
      }, 200);

      const response = await fetch('/api/recognizeIngredients', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) throw new Error('Failed to process image');

      const data = await response.json();
      setIngredients(data);
      setAlert({ type: 'success', message: 'Ingredients recognized successfully!' });
      
      // Automatically generate recipes after ingredients are recognized
      if (data.length > 0) {
        // Short delay to allow user to see the recognized ingredients
        setTimeout(() => {
          handleGenerateRecipes(data);
        }, 1000);
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to process image. Please try again.' });
      console.error('Upload error:', error);
    } finally {
      setIsLoading(false);
      if (setParentLoading) setParentLoading(false);
      setTimeout(() => setUploadProgress(0), 500);
    }
  }, [user, setParentLoading, subscriptionStatus]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
    disabled: isLoading || (subscriptionStatus?.limits?.remainingGenerations ?? 1) <= 0
  });

  const handleAddIngredient = (e: FormEvent) => {
    e.preventDefault();
    const trimmedIngredient = newIngredient.trim();
    
    if (!trimmedIngredient) return;
    if (ingredients.includes(trimmedIngredient)) {
      setAlert({ type: 'info', message: 'This ingredient is already in the list' });
      return;
    }

    setIngredients(prev => [...prev, trimmedIngredient]);
    setNewIngredient('');
  };

  const handleDeleteIngredient = (ingredientToDelete: string) => {
    setIngredients(ingredients.filter(ing => ing !== ingredientToDelete));
  };

  const handleGenerateRecipes = async (ingredientsToUse = ingredients) => {
    if (!user) {
      setAlert({
        type: 'error',
        message: 'Please sign in to generate recipes'
      });
      return;
    }
  
    if (ingredientsToUse.length === 0) {
      setAlert({ type: 'info', message: 'Please add some ingredients first.' });
      return;
    }
  
    // Check if user has remaining generations before generating
    if (subscriptionStatus?.limits?.remainingGenerations !== undefined && subscriptionStatus.limits.remainingGenerations <= 0) {
      setAlert({
        type: 'warning',
        message: subscriptionStatus.subscriptionTier === 'premium'
          ? 'Daily generation limit reached. Try again tomorrow!'
          : 'Daily generation limit reached. Upgrade to premium for more generations!'
      });
      return;
    }
  
    try {
      setIsLoading(true);
      if (setParentLoading) setParentLoading(true);
  
      console.log('Sending recipe generation request with ingredients:', ingredientsToUse);
  
      // Call the regular generate recipe API
      const response = await fetch('/api/generateRecipe', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          ingredients: ingredientsToUse,
          userId: user.uid 
        })
      });
  
      // Check for errors
      if (!response.ok) {
        let errorMessage = 'Failed to generate recipes';
        
        try {
          const errorData = await response.json();
          console.error('Error response:', errorData);
          
          if (response.status === 429) {
            errorMessage = subscriptionStatus?.subscriptionTier === 'premium'
              ? 'Daily generation limit reached. Try again tomorrow!'
              : 'Daily generation limit reached. Upgrade to premium for more generations!';
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }
  
      const data = await response.json();
      
      if (typeof onRecipesGenerated === 'function') {
        onRecipesGenerated(data);
      }
      
      // Now explicitly call our direct counter update API to ensure the counter increments
      try {
        console.log('Explicitly updating generation count via direct API');
        const countUpdateResponse = await fetch('/api/update-generation-count', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: user.uid,
            action: 'increment'
          })
        });
        
        if (countUpdateResponse.ok) {
          const countData = await countUpdateResponse.json();
          console.log('Generation count updated successfully:', countData);
          
          // Force immediate UI update to show correct remaining generations
          if (subscriptionStatus) {
            setSubscriptionStatus(prev => {
              if (!prev) return null;
              
              console.log(`Updating UI from ${prev.limits.remainingGenerations} to ${countData.remainingGenerations} generations left`);
              
              return {
                ...prev,
                limits: {
                  ...prev.limits,
                  remainingGenerations: countData.remainingGenerations
                }
              };
            });
          }
        } else {
          console.error('Failed to update generation count via direct API');
        }
      } catch (countError) {
        console.error('Error updating generation count:', countError);
        // Non-fatal, continue with recipe display
      }
      
      // Update success message based on subscription tier
      const isPremium = subscriptionStatus?.subscriptionTier === 'premium';
      const recipeCount = isPremium ? 25 : 6;
      const successMessage = isPremium
        ? `Generated ${recipeCount} recipe suggestions!`
        : `Generated ${recipeCount} recipe suggestions! Upgrade to Premium to unlock more recipes.`;
      
      setAlert({ type: 'success', message: successMessage });
    } catch (error) {
      console.error('Recipe generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate recipes. Please try again.';
      setAlert({ type: 'error', message: errorMessage });
    } finally {
      setIsLoading(false);
      if (setParentLoading) setParentLoading(false);
    }
  };

  const recipeCount = subscriptionStatus?.subscriptionTier === 'premium' ? 25 : 6;
  const generationLimit = subscriptionStatus?.subscriptionTier === 'premium' ? 10 : 1;

  return (
    <div className="w-full space-y-6">
      {alert && <Alert {...alert} onClose={() => setAlert(null)} />}
      
      {user && <SubscriptionBanner status={subscriptionStatus} />}

      {/* Upload Section */}
      <div 
        {...getRootProps()} 
        className={`relative border-2 border-dashed rounded-xl transition-all duration-300 
          ${isDragActive ? 'border-amber-500 bg-amber-50' : 'border-gray-300 hover:border-amber-500'} 
          ${previewUrl ? 'h-48 sm:h-64' : 'h-36 sm:h-48'}
          ${isLoading ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input {...getInputProps()} />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="w-full h-full object-contain rounded-lg" />
          ) : (
            <div className="text-center">
              <Camera className="mx-auto h-8 w-8 text-gray-400 group-hover:text-amber-500 transition-colors" />
              <p className="mt-2 text-sm text-gray-500">
                {isDragActive ? 'Drop image here' : 'Drag & drop or click to upload'}
              </p>
            </div>
          )}
        </div>
        {uploadProgress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
            <div 
              className="h-full bg-amber-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Ingredients Section */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Ingredients</h3>
        <div className="flex flex-wrap gap-2 min-h-8 mb-4">
          {ingredients.map((ingredient, index) => (
            <IngredientTag
              key={index}
              ingredient={ingredient}
              onDelete={handleDeleteIngredient}
            />
          ))}
        </div>

        <form onSubmit={handleAddIngredient} className="flex gap-2">
          <input
            type="text"
            value={newIngredient}
            onChange={(e) => setNewIngredient(e.target.value)}
            placeholder="Add ingredient..."
            className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !newIngredient.trim()}
            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Add ingredient"
          >
            <Plus size={20} />
          </button>
        </form>

        <button
          onClick={() => handleGenerateRecipes()}
          disabled={isLoading || ingredients.length === 0 || !user || (subscriptionStatus?.limits?.remainingGenerations ?? 1) <= 0}
          className="w-full mt-4 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        >
          {isLoading ? 'Generating...' : `Generate ${recipeCount} Recipes`}
        </button>
        
        {!user && (
          <p className="mt-2 text-center text-sm text-gray-600">
            Please <a href="/login" className="text-amber-600 hover:text-amber-700">sign in</a> to generate recipes
          </p>
        )}
        
        {user && subscriptionStatus?.subscriptionTier !== 'premium' && (
          <p className="mt-2 text-center text-sm text-gray-600">
            <a href="/subscription" className="text-amber-600 hover:text-amber-700">
              Upgrade to Premium
            </a> to get {generationLimit === 1 ? '10 generations per day' : 'more recipes'}
          </p>
        )}
      </div>

      {isLoading && <Spinner />}
    </div>
  );
};

export default FileUpload;