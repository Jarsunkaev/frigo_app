import React from 'react';
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <Header />
      
      <main className="container mx-auto px-4 py-16 pt-24">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Cookie Policy</h1>
          
          <div className="prose prose-amber max-w-none">
            <p>Last updated: March 23, 2025</p>
            
            <h2>1. What Are Cookies</h2>
            <p>
              Cookies are small pieces of text sent to your web browser by a website you visit. A cookie file is stored in your web browser and allows the Service or a third-party to recognize you and make your next visit easier and the Service more useful to you.
            </p>
            
            <h2>2. How We Use Cookies</h2>
            <p>When you use and access our website, we may place a number of cookie files in your web browser. We use cookies for the following purposes:</p>
            <ul>
              <li>To enable certain functions of the Service</li>
              <li>To provide analytics</li>
              <li>To store your preferences</li>
              <li>To enable advertisements delivery, including behavioral advertising</li>
            </ul>
            
            <h2>3. Types of Cookies We Use</h2>
            
            <h3>3.1 Necessary Cookies</h3>
            <p>These cookies are essential for you to browse the website and use its features, such as accessing secure areas of the site. These cookies cannot be turned off.</p>
            <table className="min-w-full border border-gray-200 mt-2 mb-4">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 border border-gray-200 text-left">Name</th>
                  <th className="px-4 py-2 border border-gray-200 text-left">Provider</th>
                  <th className="px-4 py-2 border border-gray-200 text-left">Purpose</th>
                  <th className="px-4 py-2 border border-gray-200 text-left">Expiry</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border border-gray-200">frigo-gdpr-consent</td>
                  <td className="px-4 py-2 border border-gray-200">FRIGO</td>
                  <td className="px-4 py-2 border border-gray-200">Stores your cookie consent preferences</td>
                  <td className="px-4 py-2 border border-gray-200">150 days</td>
                </tr>
              </tbody>
            </table>
            
            <h3>3.2 Functional Cookies</h3>
            <p>These cookies remember choices you make to improve your experience.</p>
            <table className="min-w-full border border-gray-200 mt-2 mb-4">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 border border-gray-200 text-left">Name</th>
                  <th className="px-4 py-2 border border-gray-200 text-left">Provider</th>
                  <th className="px-4 py-2 border border-gray-200 text-left">Purpose</th>
                  <th className="px-4 py-2 border border-gray-200 text-left">Expiry</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border border-gray-200">frigo-functional-consent</td>
                  <td className="px-4 py-2 border border-gray-200">FRIGO</td>
                  <td className="px-4 py-2 border border-gray-200">Records functional cookie consent</td>
                  <td className="px-4 py-2 border border-gray-200">150 days</td>
                </tr>
              </tbody>
            </table>
            
            <h3>3.3 Analytics Cookies</h3>
            <p>These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site.</p>
            <table className="min-w-full border border-gray-200 mt-2 mb-4">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 border border-gray-200 text-left">Name</th>
                  <th className="px-4 py-2 border border-gray-200 text-left">Provider</th>
                  <th className="px-4 py-2 border border-gray-200 text-left">Purpose</th>
                  <th className="px-4 py-2 border border-gray-200 text-left">Expiry</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border border-gray-200">ph_*</td>
                  <td className="px-4 py-2 border border-gray-200">PostHog</td>
                  <td className="px-4 py-2 border border-gray-200">Analytics cookies for measuring site performance and user behavior</td>
                  <td className="px-4 py-2 border border-gray-200">1 year</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 border border-gray-200">frigo-analytics-consent</td>
                  <td className="px-4 py-2 border border-gray-200">FRIGO</td>
                  <td className="px-4 py-2 border border-gray-200">Records analytics cookie consent</td>
                  <td className="px-4 py-2 border border-gray-200">150 days</td>
                </tr>
              </tbody>
            </table>
            
            <h3>3.4 Marketing Cookies</h3>
            <p>These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites.</p>
            <table className="min-w-full border border-gray-200 mt-2 mb-4">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 border border-gray-200 text-left">Name</th>
                  <th className="px-4 py-2 border border-gray-200 text-left">Provider</th>
                  <th className="px-4 py-2 border border-gray-200 text-left">Purpose</th>
                  <th className="px-4 py-2 border border-gray-200 text-left">Expiry</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border border-gray-200">frigo-marketing-consent</td>
                  <td className="px-4 py-2 border border-gray-200">FRIGO</td>
                  <td className="px-4 py-2 border border-gray-200">Records marketing cookie consent</td>
                  <td className="px-4 py-2 border border-gray-200">150 days</td>
                </tr>
              </tbody>
            </table>
            
            <h2>4. How to Manage Cookies</h2>
            <p>You can manage your cookie preferences in several ways:</p>
            <ul>
              <li><strong>Through Our Cookie Banner</strong>: Use our cookie consent banner to select which types of cookies you want to accept.</li>
              <li><strong>Browser Settings</strong>: Most browsers allow you to refuse to accept cookies and to delete cookies. You can set or amend your web browser controls to accept or refuse cookies.</li>
            </ul>
            
            <p>Please note that if you choose to reject certain cookies, you may not be able to use all the features of our website.</p>
            
            <h2>5. Contact Us</h2>
            <p>
              If you have any questions about our use of cookies, please contact us at: <a href="mailto:privacy@frigo-app.com" className="text-amber-600">privacy@frigo-app.com</a>
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CookiePolicy;