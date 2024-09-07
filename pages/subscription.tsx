import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../pages/api/firebase';
import { getUserData } from '../pages/api/firebase';
import Header from '../components/header/Header';
import Footer from '../components/footer/Footer';
import SubscriptionComponent from '../components/subscription/SubscriptionComponent';

const SubscriptionPage = () => {
  const [user, loading] = useAuthState(auth);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    const data = await getUserData(user.uid);
    setUserData(data);
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in to view this page.</div>;

  return (
    <div className="flex min-h-screen flex-col bg-[#fcf9ed]">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 mt-32">
        <h1 className="text-3xl font-bold text-center mb-8 text-[#193722]">Subscription Management</h1>
        <SubscriptionComponent userData={userData} onSubscriptionChange={fetchUserData} />
        {/* You can add more subscription-related components or information here */}
      </main>
      <Footer />
    </div>
  );
};

export default SubscriptionPage;