import React from "react";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import { Camera, Leaf, ChefHat, Utensils, ArrowRight } from 'lucide-react';

const AboutPage = () => {
  const features = [
    {
      title: 'Capture Ingredients',
      description: 'Simply snap a photo of your fridge or pantry contents',
      icon: Camera,
      image: 'capture.webp',
      color: 'bg-blue-50'
    },
    {
      title: 'Smart Recognition',
      description: 'Our AI technology identifies your available ingredients',
      icon: Leaf,
      image: 'analyse.png',
      color: 'bg-green-50'
    },
    {
      title: 'Recipe Matching',
      description: 'Get personalized recipe suggestions based on what you have',
      icon: ChefHat,
      image: 'recipes.png',
      color: 'bg-amber-50'
    },
    {
      title: 'Cook & Enjoy',
      description: 'Transform your ingredients into delicious meals',
      icon: Utensils,
      image: 'cook.png',
      color: 'bg-red-50'
    }
  ];

  const stats = [
    { value: '33%', label: 'of global food production goes to waste annually' },
    { value: '$1500', label: 'average annual savings per household using Frigo' },
    { value: '60%', label: 'reduction in household food waste with smart planning' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <Header />
      
      <main className="pt-24">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Cook Smart,{' '}
              <span className="text-amber-500">Waste Less</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Your AI-powered kitchen assistant for sustainable cooking and smarter meal planning
            </p>
            <a 
              href="/generate"
              className="inline-flex items-center justify-center px-8 py-4 bg-amber-500 text-white rounded-full font-semibold hover:bg-amber-600 transition-colors group"
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-3xl p-8 md:p-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Our Mission</h2>
                <div className="space-y-6 text-lg text-gray-600">
                  <p>
                    We've all been there - staring into a full fridge but feeling like there's nothing to eat. 
                    That's where Frigo comes in! We're revolutionizing the way you cook by turning your 
                    kitchen into a hub of sustainable culinary creativity.
                  </p>
                  <p>
                    Through the power of AI and computer vision, we help you identify ingredients you already 
                    have and suggest delicious recipes that make the most of them. No more forgotten veggies 
                    or mystery leftovers!
                  </p>
                  <p>
                    Working with our partners at Spoonacular, we provide you with recipes that are not just 
                    delicious but also practical, helping you reduce waste and save money while creating 
                    amazing meals.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-3 gap-8">
                {stats.map((stat, index) => (
                  <div 
                    key={index}
                    className="bg-white rounded-2xl p-6 text-center shadow-lg"
                  >
                    <div className="text-4xl font-bold text-amber-500 mb-2">
                      {stat.value}
                    </div>
                    <p className="text-gray-600">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                How Frigo Works Its Magic
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                {features.map((feature, index) => (
                  <div 
                    key={index}
                    className="group relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="aspect-w-16 aspect-h-9">
                      <img
                        src={feature.image}
                        alt={feature.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-6">
                      <div className={`${feature.color} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                        <feature.icon className="w-6 h-6 text-gray-700" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {`${index + 1}. ${feature.title}`}
                      </h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-amber-500">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center text-white">
              <h2 className="text-3xl font-bold mb-6">
                Ready to Reduce Food Waste?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Join thousands of conscious cooks who are saving money and the planet with Frigo.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="/register"
                  className="px-8 py-4 bg-white text-amber-500 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                >
                  Get Started Free
                </a>
                <a
                  href="/generate"
                  className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-semibold hover:bg-white/10 transition-colors"
                >
                  Try Demo
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;