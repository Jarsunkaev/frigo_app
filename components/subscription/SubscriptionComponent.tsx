import React from 'react';

type SubscriptionComponentProps = {
  userData: {
    id: string;
    subscriptionTier: string;
    generationsLeft: number;
  } | null;
  onSubscriptionChange: () => void;
};

const SubscriptionComponent: React.FC<SubscriptionComponentProps> = ({ userData, onSubscriptionChange }) => {
  const handleSubscribe = () => {
    // Replace 'YOUR_STRIPE_PAYMENT_LINK' with your actual Stripe payment link
    window.location.href = `https://buy.stripe.com/test_6oEbKOa2h5ox61G144?client_reference_id=${userData?.id}`;
  };

  if (!userData) return <div>Loading subscription data...</div>;

  const maxGenerations = userData.subscriptionTier === 'premium' ? 15 : 2;

  return (
    <div className="bg-white bg-opacity-40 backdrop-filter backdrop-blur-md p-6 rounded-3xl shadow-lg border-2 border-[#193722]">
      <h2 className="text-2xl font-bold mb-4 text-[#193722]">Your Subscription</h2>
      <div className="mb-4">
        <p className="text-[#193722]">Current Plan: {userData.subscriptionTier}</p>
        <p className="text-[#193722]">Generations Left: {userData.generationsLeft} / {maxGenerations}</p>
      </div>
      {userData.subscriptionTier === 'free' && (
        <button 
          onClick={handleSubscribe}
          className="bg-[#193722] text-white py-2 px-4 rounded-full hover:bg-[#254b2d] transition-colors duration-300"
        >
          Upgrade to Premium (15 recipe generations/month)
        </button>
      )}
      {userData.subscriptionTier === 'premium' && (
        <p className="text-[#193722]">You are currently on the Premium plan. Enjoy your 15 recipe generations per month!</p>
      )}
    </div>
  );
};

export default SubscriptionComponent;