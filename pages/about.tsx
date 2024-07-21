import React from "react";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";

const AboutPage = () => {
  return (
    <div className="bg-white">
      <Header />
      <div className="container mx-auto mt-20 p-8">
        <h1 className="text-4xl font-bold text-center my-8">
          Discover Deliciousness
        </h1>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xl mb-6">
            Ever find yourself staring into your fridge, wondering what to cook?
            Our app turns your ingredients into inspiration!
          </p>
          <p className="text-xl mb-6">
            With just a photo of your fridge or pantry, our intelligent system
            identifies your ingredients and pairs them with the perfect recipe.
            Say goodbye to food waste and hello to new culinary adventures.
          </p>
          <p className="text-xl mb-6">
            Our partnership with Spoonacular ensures you get tailored recipes
            that are not only tasty but also maximize what you already have.
            It's time to unleash the chef within you, one ingredient at a time.
          </p>
        </div>

        <div className="max-w-4xl mx-auto mt-12">
          <h2 className="text-3xl font-bold text-center my-8">
            How to Use the App
          </h2>

          <div className="flex flex-col items-center">
            <div className="mb-8">
              <h3 className="text-2xl font-bold">1. Take a Photo</h3>
              <img
                src="camera.png"
                alt="Take a Photo"
                className="w-full h-64 object-cover mt-4"
              />
              <p className="text-lg mt-4">
                Snap a picture of your fridge or pantry using the app.
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-bold">2. Identify Ingredients</h3>
              <img
                src="id.png"
                alt="Identify Ingredients"
                className="w-full h-64 object-contain mt-4"
              />
              <p className="text-lg mt-4">
                Our AI analyzes the photo and identifies all the ingredients.
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-bold">3. Get Recipes</h3>
              <img
                src="recipe.png"
                alt="Get Recipes"
                className="w-full h-64 object-contain mt-4"
              />
              <p className="text-lg mt-4">
                Receive tailored recipes based on the identified ingredients.
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-bold">4. Cook and Enjoy</h3>
              <img
                src="cooking.png"
                alt="Cook and Enjoy"
                className="w-full h-64 object-contain mt-4"
              />
              <p className="text-lg mt-4">
                Follow the recipe instructions and enjoy your meal!
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AboutPage;
