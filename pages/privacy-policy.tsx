import React from 'react';
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <Header />
      
      <main className="container mx-auto px-4 py-16 pt-24">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
          
          <div className="prose prose-amber max-w-none">
            <p>Last updated: March 23, 2025</p>
            
            <h2>1. Introduction</h2>
            <p>
              Welcome to FRIGO ("we," "our," or "us"). We respect your privacy and are committed to 
              protecting your personal data. This privacy policy will inform you about how we look after 
              your personal data when you visit our website and tell you about your privacy rights and 
              how the law protects you.
            </p>
            
            <h2>2. Data We Collect</h2>
            <p>We may collect, use, store and transfer different kinds of personal data about you including:</p>
            <ul>
              <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
              <li><strong>Contact Data</strong> includes email address.</li>
              <li><strong>Technical Data</strong> includes internet protocol (IP) address, browser type and version, time zone setting, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website.</li>
              <li><strong>Usage Data</strong> includes information about how you use our website, products and services.</li>
            </ul>
            
            <h2>3. How We Use Your Data</h2>
            <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
            <ul>
              <li>To register you as a new customer.</li>
              <li>To provide and improve our service to you.</li>
              <li>To manage our relationship with you.</li>
              <li>To administer and protect our business and this website.</li>
              <li>To deliver relevant website content and advertisements to you.</li>
              <li>To use data analytics to improve our website, products/services, marketing, customer relationships and experiences.</li>
            </ul>
            
            <h2>4. Cookies</h2>
            <p>
              We use cookies and similar tracking technologies to track activity on our website and store certain information. 
              You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. 
              However, if you do not accept cookies, you may not be able to use some portions of our Service.
            </p>
            <p>We use the following types of cookies:</p>
            <ul>
              <li><strong>Necessary Cookies</strong>: Required for the website to function properly.</li>
              <li><strong>Functional Cookies</strong>: Remember your preferences and settings.</li>
              <li><strong>Analytics Cookies</strong>: Help us understand how visitors interact with our website by collecting and reporting information anonymously.</li>
              <li><strong>Marketing Cookies</strong>: Track your online activity to help advertisers deliver more relevant advertising.</li>
            </ul>
            <p>You can manage your cookie preferences through our cookie banner or by updating your browser settings.</p>
            
            <h2>5. Data Sharing and Transfers</h2>
            <p>
              We may share your personal data with selected third parties including business partners, 
              suppliers and sub-contractors for the performance of any contract we enter into with them or you.
            </p>
            
            <h2>6. Data Security</h2>
            <p>
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, 
              used or accessed in an unauthorized way, altered or disclosed.
            </p>
            
            <h2>7. Your Legal Rights</h2>
            <p>Under GDPR, you have rights in relation to your personal data including:</p>
            <ul>
              <li>The right to access your personal data.</li>
              <li>The right to correction of your personal data.</li>
              <li>The right to erasure of your personal data.</li>
              <li>The right to restrict processing of your personal data.</li>
              <li>The right to data portability.</li>
              <li>The right to object to processing of your personal data.</li>
              <li>Rights in relation to automated decision making and profiling.</li>
            </ul>
            
            <h2>8. Contact Us</h2>
            <p>
              If you have any questions about this privacy policy or our privacy practices, 
              please contact us at: <a href="mailto:privacy@frigo-app.com" className="text-amber-600">privacy@frigo-app.com</a>
            </p>
            
            <h2>9. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting 
              the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;