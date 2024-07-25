import React from "react";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";

const AboutPage = () => {
  return (
    <div className="bg-fcf9ed min-h-screen relative">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <circle className="circle-animation" cx="5%" cy="10%" r="50" fill="#10B981" />
          <circle className="circle-animation" cx="95%" cy="50%" r="100" fill="#10B981" />
          <circle className="circle-animation" cx="10%" cy="90%" r="70" fill="#10B981" />
        </svg>
      </div>

      <div className="relative z-10">
        <Header />
        
        <div className="container mx-auto mt-24 p-8">
          <h1 className="text-5xl font-bold text-center my-12 text-[#193722]">
            Cook Smart, Waste Less
          </h1>
          
          <div className="max-w-4xl mx-auto bg-white bg-opacity-40 backdrop-filter backdrop-blur-xl rounded-3xl shadow-lg p-8 mb-16 border border-white border-opacity-20">
            <p className="text-xl mb-6 text-[#193722]">
              We've all been there - staring into a full fridge but feeling like there's nothing to eat. That's where Frigo comes in!
            </p>
            <p className="text-xl mb-6 text-[#193722]">
              Just snap a pic of your fridge or pantry, and let our smart tech do the rest. We'll identify what you've got and whip up recipe ideas that'll make your taste buds dance. No more forgotten veggies or mystery leftovers!
            </p>
            <p className="text-xl mb-6 text-[#193722]">
              Thanks to our buddies at Spoonacular, you'll get recipes that are not just delicious, but also use up what you already have. It's time to unleash your inner chef and turn those random ingredients into mouthwatering meals!
            </p>
          </div>

          <div className="max-w-4xl mx-auto mt-16 relative mb-24">
            <div className="bg-white bg-opacity-40 backdrop-filter backdrop-blur-xl rounded-3xl shadow-lg p-8 relative z-10 border border-white border-opacity-20">
              <h2 className="text-4xl font-bold text-center my-8 text-[#193722]">
                Join the Fight Against Food Waste
              </h2>
              <div className="text-center">
                <p className="text-xl mb-6 text-[#193722]">
                  Did you know that about one-third of all food produced globally goes to waste? That's not just bad for our wallets - it's terrible for the planet too.
                </p>
                <p className="text-xl mb-6 text-[#193722]">
                  Frigo is on a mission to change that. By helping you use what you already have, we're not just saving you money - we're helping you become a sustainability superhero!
                </p>
                <p className="text-xl mb-6 text-[#193722]">
                  Every recipe you make with Frigo is a step towards a world with less waste. So go ahead, take that photo, and let's turn your fridge into a treasure trove of delicious possibilities!
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto mt-16">
            <h2 className="text-4xl font-bold text-center my-12 text-[#193722]">
              How Frigo Works Its Magic
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {[
                { title: 'Capture Ingredients', img: 'camera.png' },
                { title: 'Recognize Ingredients', img: 'ingredients.jpg' },
                { title: 'Match Recipe', img: 'onlinerec.jpg' },
                { title: 'Cook, Eat, Repeat', img: 'food.jpg' }
              ].map((item, index) => (
                <div key={index} className="bg-white bg-opacity-60 backdrop-filter backdrop-blur-lg rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-[#193722] mb-4">{`${index + 1}. ${item.title}`}</h3>
                    <p className="text-lg text-[#193722]">
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default AboutPage;
