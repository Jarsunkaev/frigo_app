import React from "react";
import { Instagram, Facebook, Twitter } from 'lucide-react';

const Footer = () => {
  const socialLinks = [
    { icon: Instagram, href: "https://www.instagram.com/frigo_recipies?igsh=enQ0dWo3NXlxb3Nu&utm_source=qr", label: "Instagram" },
    { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
    { icon: Twitter, href: "https://twitter.com", label: "X (Twitter)" }
  ];

  // Modify the footerLinks object directly
  const footerLinks = {
    Product: ['Features', 'Pricing', 'FAQ'],
    Company: ['About', 'Contact'],
    Legal: ['Privacy Policy', 'Cookie Policy', 'Terms']
  };

  // Create a function to get the URL based on the section and link
  const getUrl = (section: string, link: string) => {
    if (section === 'Product') {
      if (link === 'Features') return '/#features';
      if (link === 'Pricing') return '/#pricing';
      if (link === 'FAQ') return '/#faq';
    }
    if (section === 'Legal') {
      if (link === 'Privacy Policy') return '/privacy-policy';
      if (link === 'Cookie Policy') return '/cookie-policy';
      if (link === 'Terms') return '/terms';
    }
    if (section === 'Company') {
      if (link === 'About') return '/about';
      if (link === 'Contact') return '/contact';
    }
    return '/';
  };

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center mb-4">
              <span className="text-2xl font-bold text-amber-500">FRIGO</span>
              <img src="/favicon.ico" alt="Frigo" className="h-8 w-8 ml-2" />
            </div>
            <p className="text-gray-400 text-sm mb-6">
              Making sustainable cooking easy and delicious for everyone.
            </p>
            <div className="flex gap-4">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition duration-300"
                  aria-label={label}
                >
                  <Icon className="w-5 h-5 text-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-bold mb-4 text-sm">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href={getUrl(title, link)}
                      className="text-sm text-gray-400 hover:text-white transition duration-200"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-400">
          <p>© {new Date().getFullYear()} FRIGO. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
export default Footer;