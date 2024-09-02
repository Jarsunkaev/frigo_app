import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface AutocompleteProps {
  onSelect: (ingredient: string) => void;
}

const Autocomplete: React.FC<AutocompleteProps> = ({ onSelect }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState<string>('');

  useEffect(() => {
    if (inputValue) {
      const fetchSuggestions = async () => {
        try {
          const response = await axios.get(`https://api.spoonacular.com/food/ingredients/autocomplete`, {
            params: {
              query: inputValue,
              number: 5,
              apiKey: 'YOUR_SPOONACULAR_API_KEY', // Replace with your actual API key
            },
          });
          setSuggestions(response.data.map((item: { name: string }) => item.name));
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        }
      };

      fetchSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [inputValue]);

  const handleSelect = (suggestion: string) => {
    onSelect(suggestion);
    setInputValue(''); // Clear the input after selecting
    setSuggestions([]); // Clear suggestions after selecting
  };

  return (
    <div>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Type an ingredient"
        className="border rounded px-3 py-2 w-full"
      />
      {suggestions.length > 0 && (
        <ul className="border mt-2 rounded bg-white w-full">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => handleSelect(suggestion)}
              className="cursor-pointer p-2 hover:bg-gray-200"
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Autocomplete;
