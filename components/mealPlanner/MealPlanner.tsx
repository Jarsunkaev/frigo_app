import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../pages/api/firebase';
import { useSubscription } from '../../hooks/useSubscription';
import { 
  Calendar, 
  ChevronDown, 
  ShoppingBag, 
  Users, 
  Clock, 
  BookOpen, 
  Crown, 
  AlertCircle, 
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Filter,
  Download,
  Printer,
  FileText
} from 'lucide-react';
import axios from 'axios';

interface MealPlanProps {
  availableIngredients?: string[];
  onAddToSavedRecipes?: (recipeId: number) => void;
}

interface MealPlanSettings {
  timeFrame: 'day' | 'week';
  targetCalories?: number;
  diet?: string;
  exclude?: string;
}

interface Meal {
  id: number;
  title: string;
  readyInMinutes: number;
  servings: number;
  sourceUrl: string;
  image?: string;
  imageType?: string;
  mealType?: 'breakfast' | 'lunch' | 'dinner';
}

interface MealPlanDay {
  meals: Meal[];
  nutrients: {
    calories: number;
    protein: number;
    fat: number;
    carbohydrates: number;
  };
}

interface ShoppingListItem {
  name: string;
  amount: number;
  unit: string;
  recipes: string[];
  aisle: string;
}

const MealPlannerView: React.FC<MealPlanProps> = ({ 
  availableIngredients = [],
  onAddToSavedRecipes
}) => {
  const [user, userLoading] = useAuthState(auth);
  const { isPremium, subscription, loading: subLoading } = useSubscription();
  const [mealPlan, setMealPlan] = useState<any | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [settings, setSettings] = useState<MealPlanSettings>({
    timeFrame: 'week',
    targetCalories: 2000,
    diet: '',
    exclude: ''
  });
  const [dietOptions] = useState([
    { value: '', label: 'No Restrictions' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'glutenFree', label: 'Gluten Free' },
    { value: 'ketogenic', label: 'Ketogenic' },
    { value: 'paleo', label: 'Paleo' }
  ]);
  const [html2pdf, setHtml2pdf] = useState(null);

  // Load html2pdf dynamically
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('html2pdf.js').then((module) => {
        setHtml2pdf(() => module.default);
      }).catch(err => {
        console.error('Failed to load html2pdf.js:', err);
      });
    }
  }, []);

  // Map day of week to readable format
  const dayLabels: Record<string, string> = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  };

  // Days shown for free vs premium users
  const freeDays = ['monday', 'tuesday', 'wednesday'];
  const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const visibleDays = isPremium ? allDays : freeDays;

  // Initialize selectedDay to the first day
  useEffect(() => {
    if (!selectedDay && visibleDays.length > 0) {
      setSelectedDay(visibleDays[0]);
    }
  }, [isPremium, visibleDays, selectedDay]);

  // Process meals to add mealType if it doesn't exist
  const processMealPlan = (mealPlanData: any): any => {
    if (!mealPlanData) return null;
    
    // Clone the meal plan data to avoid mutating the original
    const processedMealPlan = JSON.parse(JSON.stringify(mealPlanData));
    
    // Process the meal plan
    if (settings.timeFrame === 'day' && processedMealPlan.meals) {
      // For a single day, assign meal types based on position
      processedMealPlan.meals = processedMealPlan.meals.map((meal: any, index: number) => {
        if (!meal.mealType) {
          if (index === 0) meal.mealType = 'breakfast';
          else if (index === 1) meal.mealType = 'lunch';
          else meal.mealType = 'dinner';
        }
        return meal;
      });
    } else if (settings.timeFrame === 'week' && processedMealPlan.week) {
      // For a week, process each day
      Object.keys(processedMealPlan.week).forEach(day => {
        if (processedMealPlan.week[day] && processedMealPlan.week[day].meals) {
          processedMealPlan.week[day].meals = processedMealPlan.week[day].meals.map((meal: any, index: number) => {
            if (!meal.mealType) {
              if (index === 0) meal.mealType = 'breakfast';
              else if (index === 1) meal.mealType = 'lunch';
              else meal.mealType = 'dinner';
            }
            return meal;
          });
        }
      });
    }
    
    return processedMealPlan;
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: name === 'targetCalories' ? parseInt(value) || undefined : value
    }));
  };

  // Function to generate plain text shopping list
  const generateShoppingListText = (groupedList: Record<string, ShoppingListItem[]>): string => {
    let text = "SHOPPING LIST\n\n";
    
    Object.entries(groupedList).forEach(([aisle, items]) => {
      text += `${aisle.toUpperCase()}\n`;
      text += `${'='.repeat(aisle.length)}\n`;
      
      items.forEach(item => {
        text += `- ${item.name}: ${item.amount} ${item.unit}\n`;
      });
      
      text += '\n';
    });
    
    text += "\nGenerated by FRIGO Meal Planner";
    
    return text;
  };

  const handleViewRecipe = async (recipeId: number) => {
    window.open(`/recipes?view=${recipeId}`, '_blank');
  };
  
  const generateShoppingList = () => {
    if (!mealPlan) return;
    
    // Extract all recipe IDs from the meal plan
    const recipeIds: number[] = [];
    
    if (settings.timeFrame === 'day' && mealPlan.meals) {
      mealPlan.meals.forEach((meal: Meal) => {
        if (meal.id) recipeIds.push(meal.id);
      });
    } else if (settings.timeFrame === 'week' && mealPlan.week) {
      // Only include days that are visible to the user based on subscription
      visibleDays.forEach(day => {
        if (mealPlan.week[day] && mealPlan.week[day].meals) {
          mealPlan.week[day].meals.forEach((meal: Meal) => {
            if (meal.id) recipeIds.push(meal.id);
          });
        }
      });
    }
    
    if (recipeIds.length === 0) {
      setSuccessMessage('No recipes found to generate shopping list');
      return;
    }
    
    setIsLoading(true);
    
    // Create a date range for the shopping list
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    
    const endDate = new Date();
    if (settings.timeFrame === 'week') {
      endDate.setDate(today.getDate() + 7);
    } else {
      endDate.setDate(today.getDate() + 1);
    }
    
    // Call our shopping list API
    const fetchShoppingList = async () => {
      try {
        const token = await user?.getIdToken();
        
        const response = await axios.get(
          `/api/getRecipeInformation?ids=${recipeIds.join(',')}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        // Process ingredients from recipes
        const allIngredients: {[key: string]: ShoppingListItem} = {};
        
        response.data.forEach((recipe: any) => {
          if (recipe.extendedIngredients) {
            recipe.extendedIngredients.forEach((ingredient: any) => {
              const ingName = ingredient.name?.toLowerCase() || ingredient.originalName?.toLowerCase() || '';
              
              if (ingName) {
                // Check if ingredient is available
                const isAvailable = availableIngredients.some(available => 
                  ingName.includes(available.toLowerCase()) || available.toLowerCase().includes(ingName)
                );
                
                // Only add to shopping list if not available
                if (!isAvailable) {
                  if (allIngredients[ingName]) {
                    // Update existing ingredient
                    allIngredients[ingName].amount += parseFloat(ingredient.amount) || 0;
                    if (!allIngredients[ingName].recipes.includes(recipe.title)) {
                      allIngredients[ingName].recipes.push(recipe.title);
                    }
                  } else {
                    // Add new ingredient
                    allIngredients[ingName] = {
                      name: ingredient.originalName || ingredient.name,
                      amount: parseFloat(ingredient.amount) || 0,
                      unit: ingredient.unit || '',
                      recipes: [recipe.title],
                      aisle: ingredient.aisle || 'Other'
                    };
                  }
                }
              }
            });
          }
        });
        
        // Convert to array
        const shoppingListItems = Object.values(allIngredients);
        
        setShoppingList(shoppingListItems);
        setShowShoppingList(true);
        setIsLoading(false);
        
      } catch (error) {
        console.error('Error fetching recipe information:', error);
        setErrorMessage('Failed to generate shopping list');
        setIsLoading(false);
      }
    };
    
    fetchShoppingList();
  };

  const handleGenerateMealPlan = async () => {
    if (!user) {
      setErrorMessage('Please log in to use the meal planner');
      return;
    }

    if (availableIngredients.length === 0) {
      setErrorMessage('Please add at least one ingredient before generating a meal plan');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const token = await user.getIdToken();
      
      console.log('Generating meal plan with ingredients:', availableIngredients);
      
      const response = await axios.post('/api/generateMealPlan', 
        {
          ...settings,
          ingredients: availableIngredients
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.mealPlan) {
        // Process the meal plan to add meal types
        const processedMealPlan = processMealPlan(response.data.mealPlan);
        
        console.log('Processed meal plan:', processedMealPlan);
        
        setMealPlan(processedMealPlan);
        setShoppingList(response.data.shoppingList || []);
        setSuccessMessage('Meal plan generated successfully!');
        
        // Auto-select first day
        if (settings.timeFrame === 'week' && processedMealPlan.week) {
          setSelectedDay(visibleDays[0]);
        }
      }
    } catch (error: any) {
      console.error('Error generating meal plan:', error);
      setErrorMessage(
        error.response?.data?.error || 
        error.response?.data?.message || 
        'Failed to generate meal plan. Please try again.'
      );
      setMealPlan(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentDayMeals = (): MealPlanDay | null => {
    if (!mealPlan) return null;
    
    if (settings.timeFrame === 'day') {
      return mealPlan;
    } else if (selectedDay && mealPlan.week && mealPlan.week[selectedDay]) {
      return mealPlan.week[selectedDay];
    }
    
    return null;
  };

  const handleNextDay = () => {
    if (!selectedDay) return;
    
    const currentIndex = visibleDays.indexOf(selectedDay);
    if (currentIndex < visibleDays.length - 1) {
      setSelectedDay(visibleDays[currentIndex + 1]);
    }
  };

  const handlePrevDay = () => {
    if (!selectedDay) return;
    
    const currentIndex = visibleDays.indexOf(selectedDay);
    if (currentIndex > 0) {
      setSelectedDay(visibleDays[currentIndex - 1]);
    }
  };

  // Group shopping list by aisle
  const groupedShoppingList = shoppingList.reduce((acc, item) => {
    const aisle = item.aisle || 'Other';
    if (!acc[aisle]) {
      acc[aisle] = [];
    }
    acc[aisle].push(item);
    return acc;
  }, {} as Record<string, ShoppingListItem[]>);

  // Loading state
  if (userLoading || subLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  const currentDay = getCurrentDayMeals();
  
  // Debug log to check what's happening with the current day meals
  if (currentDay) {
    console.log('Current day meals:', currentDay.meals);
    console.log('Lunch meals:', currentDay.meals.filter(meal => meal.mealType === 'lunch'));
    console.log('Dinner meals:', currentDay.meals.filter(meal => meal.mealType === 'dinner'));
  }

  return (
    <div id="meal-planner-view" className="bg-white rounded-xl shadow-lg p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-0">
          Weekly Meal Planner
        </h2>
        <div className="flex w-full sm:w-auto gap-2 mt-2 sm:mt-0">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center justify-center gap-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex-1 sm:flex-initial"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden xs:inline">Settings</span>
          </button>
          <button
            onClick={() => {
              if (shoppingList.length === 0) {
                generateShoppingList();
              } else {
                setShowShoppingList(true);
              }
            }}
            className="flex items-center justify-center gap-1 px-3 py-2 text-sm bg-amber-500 text-white hover:bg-amber-600 rounded-lg transition-colors flex-1 sm:flex-initial"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden xs:inline">Shopping List</span>
            {shoppingList.length > 0 && (
              <span className="bg-white text-amber-500 rounded-full w-5 h-5 flex items-center justify-center text-xs ml-1">
                {shoppingList.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-sm">{errorMessage}</p>
          <button 
            className="ml-auto text-red-500 hover:text-red-700"
            onClick={() => setErrorMessage(null)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-start">
          <Check className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-sm">{successMessage}</p>
          <button 
            className="ml-auto text-green-500 hover:text-green-700"
            onClick={() => setSuccessMessage(null)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Display current ingredients being used */}
      {availableIngredients.length > 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
          <h3 className="font-medium text-amber-800 mb-2 text-sm sm:text-base">Using these ingredients:</h3>
          <div className="flex flex-wrap gap-2">
            {availableIngredients.map((ingredient, index) => (
              <span key={index} className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs">
                {ingredient}
              </span>
            ))}
          </div>
        </div>
      )}

      {showSettings && (
        <div className="mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-medium text-base sm:text-lg mb-4">Meal Plan Settings</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Frame</label>
              <div className="flex rounded-md overflow-hidden border border-gray-300">
                <button
                  type="button"
                  onClick={() => setSettings(prev => ({ ...prev, timeFrame: 'day' }))}
                  className={`flex-1 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium ${
                    settings.timeFrame === 'day'
                      ? 'bg-amber-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Single Day
                </button>
                <button
                  type="button"
                  onClick={() => setSettings(prev => ({ ...prev, timeFrame: 'week' }))}
                  className={`flex-1 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium ${
                    settings.timeFrame === 'week'
                      ? 'bg-amber-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Full Week
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="targetCalories" className="block text-sm font-medium text-gray-700 mb-1">
                Target Calories
              </label>
              <input
                type="number"
                id="targetCalories"
                name="targetCalories"
                value={settings.targetCalories || ''}
                onChange={handleSettingsChange}
                min="1000"
                max="4000"
                step="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-sm"
              />
            </div>

            <div>
              <label htmlFor="diet" className="block text-sm font-medium text-gray-700 mb-1">
                Diet Type
              </label>
              <select
                id="diet"
                name="diet"
                value={settings.diet || ''}
                onChange={handleSettingsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-sm"
              >
                {dietOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="exclude" className="block text-sm font-medium text-gray-700 mb-1">
                Exclude Ingredients
              </label>
              <input
                type="text"
                id="exclude"
                name="exclude"
                value={settings.exclude || ''}
                onChange={handleSettingsChange}
                placeholder="e.g., shellfish, peanuts"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">Separate ingredients with commas</p>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={handleGenerateMealPlan}
              disabled={isLoading}
              className="w-full py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
            >
              {isLoading ? 'Generating...' : 'Generate Meal Plan'}
            </button>
          </div>
        </div>
      )}

      {/* Shopping List Modal */}
      {showShoppingList && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowShoppingList(false)} />
          <div className="relative min-h-screen px-4 flex items-center justify-center">
            <div className="relative bg-white w-full max-w-2xl rounded-xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowShoppingList(false)}
                className="absolute right-3 top-3 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
              
              <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 pr-8">Shopping List</h3>
              
              {shoppingList.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Your shopping list is empty</p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">Generate a meal plan to see items you need to buy</p>
                </div>
              ) : (
                <div>
                  {Object.entries(groupedShoppingList).map(([aisle, items]) => (
                    <div key={aisle} className="mb-4">
                      <h4 className="font-medium text-gray-700 mb-2 text-sm sm:text-base">{aisle}</h4>
                      <ul className="bg-gray-50 rounded-lg p-3">
                        {items.map((item, index) => (
                          <li key={index} className="py-2 border-b border-gray-100 last:border-0">
                            <div className="flex flex-wrap sm:flex-nowrap justify-between">
                              <span className="font-medium text-sm sm:text-base mb-1 sm:mb-0">{item.name}</span>
                              <span className="text-gray-600 text-sm sm:text-base whitespace-nowrap ml-auto">
                                {item.amount} {item.unit}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Used in: {item.recipes.slice(0, 2).join(', ')}
                              {item.recipes.length > 2 && ` +${item.recipes.length - 2} more`}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  
                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <button
                      className="flex-1 py-2 flex items-center justify-center gap-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                      onClick={() => {
                        // Generate and download shopping list as PDF
                        if (shoppingList.length === 0) {
                          return;
                        }
                        
                        // Create HTML content for the PDF
                        const element = document.createElement('div');
                        element.innerHTML = `
                          <div style="padding: 20px; font-family: Arial, sans-serif;">
                            <h1 style="text-align: center; color: #f59e0b;">FRIGO Shopping List</h1>
                            <p style="text-align: center; color: #666;">Generated on ${new Date().toLocaleDateString()}</p>
                            
                            ${Object.entries(groupedShoppingList).map(([aisle, items]) => `
                              <div style="margin-bottom: 20px;">
                                <h2 style="color: #f59e0b; border-bottom: 1px solid #f59e0b; padding-bottom: 5px;">${aisle}</h2>
                                <ul style="list-style-type: none; padding: 0;">
                                  ${items.map(item => `
                                    <li style="padding: 8px 0; border-bottom: 1px solid #eee;">
                                      <div style="display: flex; justify-content: space-between;">
                                        <span style="font-weight: bold;">${item.name}</span>
                                        <span>${item.amount} ${item.unit}</span>
                                      </div>
                                      <div style="font-size: 12px; color: #666; margin-top: 4px;">
                                        Used in: ${item.recipes.join(', ')}
                                      </div>
                                    </li>
                                  `).join('')}
                                </ul>
                              </div>
                            `).join('')}
                          </div>
                        `;
                        
                        // Options for PDF generation
                        const opt = {
                          margin:       [10, 10, 10, 10],
                          filename:     'frigo-shopping-list.pdf',
                          image:        { type: 'jpeg', quality: 0.98 },
                          html2canvas:  { scale: 2 },
                          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
                        };
                        
                        // Generate PDF
                        if (html2pdf) {
                          html2pdf().from(element).set(opt).save();
                        } else {
                          alert('PDF generator is loading. Please try again in a moment.');
                        }
                      }}
                    >
                      <FileText className="w-4 h-4" />
                      <span>Download PDF</span>
                    </button>
                    
                    <button
                      className="flex-1 py-2 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      onClick={() => {
                        if (shoppingList.length === 0) {
                          return;
                        }
                        
                        // Prepare print view
                        const printContent = document.createElement('div');
                        printContent.innerHTML = `
                          <html>
                            <head>
                              <title>Shopping List</title>
                              <meta name="viewport" content="width=device-width, initial-scale=1.0">
                              <style>
                                body { font-family: Arial, sans-serif; padding: 20px; }
                                h1 { text-align: center; margin-bottom: 20px; color: #f59e0b; }
                                .section { margin-bottom: 20px; }
                                h2 { margin-bottom: 10px; border-bottom: 1px solid #f59e0b; padding-bottom: 5px; color: #f59e0b; }
                                ul { padding-left: 0; list-style-type: none; }
                                li { margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
                                .item-header { display: flex; justify-content: space-between; font-weight: bold; }
                                .item-recipes { font-size: 12px; color: #666; margin-top: 4px; }
                                @media print {
                                  body { font-size: 12pt; }
                                  h1 { font-size: 18pt; }
                                  h2 { font-size: 14pt; }
                                }
                                @media screen and (max-width: 480px) {
                                  body { padding: 10px; }
                                  h1 { font-size: 18px; }
                                  h2 { font-size: 16px; }
                                  .item-header { flex-direction: column; }
                                }
                              </style>
                            </head>
                            <body>
                              <h1>FRIGO Shopping List</h1>
                              ${Object.entries(groupedShoppingList).map(([aisle, items]) => `
                                <div class="section">
                                  <h2>${aisle}</h2>
                                  <ul>
                                    ${items.map(item => `
                                      <li>
                                        <div class="item-header">
                                          <span>${item.name}</span>
                                          <span>${item.amount} ${item.unit}</span>
                                        </div>
                                        <div class="item-recipes">
                                          Used in: ${item.recipes.join(', ')}
                                        </div>
                                      </li>
                                    `).join('')}
                                  </ul>
                                </div>
                              `).join('')}
                            </body>
                          </html>
                        `;
                        
                        const printWindow = window.open('', '_blank');
                        printWindow.document.write(printContent.innerHTML);
                        printWindow.document.close();
                        printWindow.onload = function() {
                          printWindow.print();
                          printWindow.close();
                        };
                      }}
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating your personalized meal plan...</p>
        </div>
      ) : !mealPlan ? (
        <div className="text-center py-10 sm:py-12 bg-amber-50 rounded-lg">
          <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-2">No Meal Plan Generated Yet</h3>
          <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto px-4">
            Generate a meal plan based on your available ingredients to see your weekly meals here
          </p>
          <button
            onClick={handleGenerateMealPlan}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            Generate Meal Plan
          </button>
        </div>
      ) : (
        <div>
          {/* Week day navigation */}
          {settings.timeFrame === 'week' && (
            <div className="flex justify-between items-center mb-6 bg-gray-50 p-2 rounded-lg overflow-x-auto">
              <button
                onClick={handlePrevDay}
                disabled={!selectedDay || visibleDays.indexOf(selectedDay) === 0}
                className={`p-1 sm:p-2 rounded flex-shrink-0 ${
                  !selectedDay || visibleDays.indexOf(selectedDay) === 0
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              
              <div className="flex-grow overflow-x-auto flex justify-center px-1">
                <div className="flex space-x-1 min-w-0">
                  {visibleDays.map(day => (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap ${
                        selectedDay === day
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <span className="hidden xs:inline">{dayLabels[day]}</span>
                      <span className="xs:hidden">{dayLabels[day].substring(0, 3)}</span>
                    </button>
                  ))}
                  
                  {!isPremium && (
                    <div className="relative flex items-center">
                      <div className="px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium bg-gray-100 text-gray-400 flex items-center gap-1 cursor-not-allowed">
                        <Crown className="w-3 h-3" />
                        <span className="hidden xs:inline">More Days</span>
                        <span className="xs:hidden">More</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={handleNextDay}
                disabled={!selectedDay || visibleDays.indexOf(selectedDay) === visibleDays.length - 1}
                className={`p-1 sm:p-2 rounded flex-shrink-0 ${
                  !selectedDay || visibleDays.indexOf(selectedDay) === visibleDays.length - 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          )}

          {currentDay ? (
            <div>
              {/* Nutrition summary */}
              <div className="bg-gray-50 rounded-lg p-3 mb-5 sm:mb-6">
                <h3 className="font-medium text-gray-800 mb-2 text-sm sm:text-base">Daily Nutrition</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-white p-2 rounded shadow-sm">
                    <div className="text-xs sm:text-sm text-gray-500">Calories</div>
                    <div className="font-bold text-amber-500 text-sm sm:text-base">
                      {Math.round(currentDay.nutrients.calories)}
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded shadow-sm">
                    <div className="text-xs sm:text-sm text-gray-500">Protein</div>
                    <div className="font-bold text-amber-500 text-sm sm:text-base">
                      {Math.round(currentDay.nutrients.protein)}g
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded shadow-sm">
                    <div className="text-xs sm:text-sm text-gray-500">Fat</div>
                    <div className="font-bold text-amber-500 text-sm sm:text-base">
                      {Math.round(currentDay.nutrients.fat)}g
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded shadow-sm">
                    <div className="text-xs sm:text-sm text-gray-500">Carbs</div>
                    <div className="font-bold text-amber-500 text-sm sm:text-base">
                      {Math.round(currentDay.nutrients.carbohydrates)}g
                    </div>
                  </div>
                </div>
              </div>

              {/* Meals list organized by meal type */}
              <div className="space-y-6 sm:space-y-8">
                <h3 className="font-medium text-gray-800 mb-2 text-sm sm:text-base">
                  Meals for {selectedDay ? dayLabels[selectedDay] : 'Today'}
                </h3>
                
                {/* Breakfast Section */}
                <div>
                  <div className="flex items-center mb-3 sm:mb-4">
                    <div className="bg-amber-100 p-1.5 sm:p-2 rounded-full mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-amber-700" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-amber-700">Breakfast</h4>
                  </div>
                  
                  {currentDay.meals.filter(meal => meal.mealType === 'breakfast').length > 0 ? (
                    <div className="space-y-4">
                      {currentDay.meals
                        .filter(meal => meal.mealType === 'breakfast')
                        .map((meal, index) => (
                          <div key={`breakfast-${index}`} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                            <div className="flex flex-col md:flex-row">
                              <div className="md:w-1/3 h-36 sm:h-40 md:h-auto relative">
                                <img
                                  src={`https://spoonacular.com/recipeImages/${meal.id}-556x370.${meal.imageType || 'jpg'}`}
                                  alt={meal.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = "https://via.placeholder.com/556x370?text=Recipe+Image";
                                  }}
                                />
                                <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
                                  Breakfast
                                </div>
                              </div>
                              <div className="p-3 sm:p-4 md:w-2/3">
                                <h4 className="font-bold text-base sm:text-lg mb-2 line-clamp-2">{meal.title}</h4>
                                <div className="flex flex-wrap gap-3 sm:gap-4 mb-3 text-xs sm:text-sm text-gray-600">
                                  <div className="flex items-center">
                                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    <span>{meal.readyInMinutes || 30} mins</span>
                                  </div>
                                  <div className="flex items-center">
                                    <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    <span>{meal.servings || 4} servings</span>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-3 sm:mt-4">
                                  <a
                                    href={meal.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors text-xs sm:text-sm"
                                  >
                                    View Recipe
                                  </a>
                                  <button
                                    onClick={() => onAddToSavedRecipes && onAddToSavedRecipes(meal.id)}
                                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-xs sm:text-sm"
                                  >
                                    Save Recipe
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500 text-sm">
                      No breakfast recipes available for this day
                    </div>
                  )}
                </div>
                
                {/* Lunch Section */}
                <div>
                  <div className="flex items-center mb-3 sm:mb-4">
                    <div className="bg-green-100 p-1.5 sm:p-2 rounded-full mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-green-700" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 10a1 1 0 01-2 0V7a1 1 0 112 0v5z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-green-700">Lunch</h4>
                  </div>
                  
                  {currentDay.meals.filter(meal => meal.mealType === 'lunch').length > 0 ? (
                    <div className="space-y-4">
                      {currentDay.meals
                        .filter(meal => meal.mealType === 'lunch')
                        .map((meal, index) => (
                          <div key={`lunch-${index}`} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                            <div className="flex flex-col md:flex-row">
                              <div className="md:w-1/3 h-36 sm:h-40 md:h-auto relative">
                                <img
                                  src={`https://spoonacular.com/recipeImages/${meal.id}-556x370.${meal.imageType || 'jpg'}`}
                                  alt={meal.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = "https://via.placeholder.com/556x370?text=Recipe+Image";
                                  }}
                                />
                                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                  Lunch
                                </div>
                              </div>
                              <div className="p-3 sm:p-4 md:w-2/3">
                                <h4 className="font-bold text-base sm:text-lg mb-2 line-clamp-2">{meal.title}</h4>
                                <div className="flex flex-wrap gap-3 sm:gap-4 mb-3 text-xs sm:text-sm text-gray-600">
                                  <div className="flex items-center">
                                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    <span>{meal.readyInMinutes || 30} mins</span>
                                  </div>
                                  <div className="flex items-center">
                                    <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    <span>{meal.servings || 4} servings</span>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-3 sm:mt-4">
                                  <a
                                    href={meal.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors text-xs sm:text-sm"
                                  >
                                    View Recipe
                                  </a>
                                  <button
                                    onClick={() => onAddToSavedRecipes && onAddToSavedRecipes(meal.id)}
                                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-xs sm:text-sm"
                                  >
                                    Save Recipe
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500 text-sm">
                      No lunch recipes available for this day
                    </div>
                  )}
                </div>
                
                {/* Dinner Section */}
                <div>
                  <div className="flex items-center mb-3 sm:mb-4">
                    <div className="bg-blue-100 p-1.5 sm:p-2 rounded-full mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-blue-700" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                      </svg>
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-blue-700">Dinner</h4>
                  </div>
                  
                  {currentDay.meals.filter(meal => meal.mealType === 'dinner').length > 0 ? (
                    <div className="space-y-4">
                      {currentDay.meals
                        .filter(meal => meal.mealType === 'dinner')
                        .map((meal, index) => (
                          <div key={`dinner-${index}`} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                            <div className="flex flex-col md:flex-row">
                              <div className="md:w-1/3 h-36 sm:h-40 md:h-auto relative">
                                <img
                                  src={`https://spoonacular.com/recipeImages/${meal.id}-556x370.${meal.imageType || 'jpg'}`}
                                  alt={meal.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = "https://via.placeholder.com/556x370?text=Recipe+Image";
                                  }}
                                />
                                <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                                  Dinner
                                </div>
                              </div>
                              <div className="p-3 sm:p-4 md:w-2/3">
                                <h4 className="font-bold text-base sm:text-lg mb-2 line-clamp-2">{meal.title}</h4>
                                <div className="flex flex-wrap gap-3 sm:gap-4 mb-3 text-xs sm:text-sm text-gray-600">
                                  <div className="flex items-center">
                                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    <span>{meal.readyInMinutes || 30} mins</span>
                                  </div>
                                  <div className="flex items-center">
                                    <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    <span>{meal.servings || 4} servings</span>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-3 sm:mt-4">
                                  <a
                                    href={meal.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors text-xs sm:text-sm"
                                  >
                                    View Recipe
                                  </a>
                                  <button
                                    onClick={() => onAddToSavedRecipes && onAddToSavedRecipes(meal.id)}
                                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-xs sm:text-sm"
                                  >
                                    Save Recipe
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500 text-sm">
                      No dinner recipes available for this day
                    </div>
                  )}
                </div>
              </div>

              {/* Premium upgrade prompt */}
              {!isPremium && (
                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-start gap-3">
                  <Crown className="w-5 h-5 text-amber-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-amber-800 mb-1 text-sm sm:text-base">Upgrade to Premium</h4>
                    <p className="text-xs sm:text-sm text-amber-700 mb-3">
                      Get access to full 7-day meal plans with our premium plan.
                    </p>
                    <a 
                      href="/subscription" 
                      className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-500 text-white rounded-lg text-xs sm:text-sm hover:bg-amber-600 transition-colors"
                    >
                      Upgrade Now
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-sm">No meal data available for the selected day.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MealPlannerView;