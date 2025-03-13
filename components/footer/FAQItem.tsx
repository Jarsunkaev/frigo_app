import React, { useState } from 'react';

const FAQItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center py-4 text-left text-xl font-medium text-gray-900 focus:outline-none"
      >
        <span>{question}</span>
        <svg
          className={`w-6 h-6 transform transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="pb-4 text-gray-600">
          <p>{answer}</p>
        </div>
      </div>
    </div>
  );
};

const FAQSection = () => (
  <section className="py-16 sm:py-24 bg-gray-50">
    <div className="container mx-auto px-4">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
        <p className="text-lg text-gray-600">
          Got questions? We've got answers. Learn more about how our app works and how it can help you cook smarter.
        </p>
      </div>
      <div className="max-w-3xl mx-auto">
        <FAQItem 
          question="How does the app work?" 
          answer="Our app uses image recognition to analyze a picture of your fridge or pantry, then generates recipe suggestions based on the available ingredients." 
        />
        <FAQItem 
          question="What features does the app offer?" 
          answer="In addition to recipe suggestions, the app lets you generate personalized meal plans and even create shopping lists to make the most out of your ingredients." 
        />
        <FAQItem 
          question="How accurate is the image recognition?" 
          answer="While our technology is continuously improving, it accurately identifies most common ingredients to give you reliable recipe recommendations." 
        />
        <FAQItem 
          question="How do I get started?" 
          answer="Simply sign up, take a picture of your fridge or pantry, and let our app do the rest. Enjoy personalized recipes, meal plans, and shopping lists right at your fingertips!" 
        />
      </div>
    </div>
  </section>
);

export default FAQSection;
