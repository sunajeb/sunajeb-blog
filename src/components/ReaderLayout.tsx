
import React from 'react';
import { Link } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const ReaderLayout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-white font-['Trebuchet MS', sans-serif]">
      <header className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <Link to="/read" className="text-2xl font-bold tracking-tight hover:text-gray-600 transition-colors">
              Blog
            </Link>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Sunaje Bhushan. All rights reserved.</p>
          <p className="mt-2">
            <a href="https://www.linkedin.com/in/sunaje-bhushan/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 transition-colors duration-150">LinkedIn</a>
            <span className="mx-2">|</span>
            <a href="https://x.com/BhushanSunaje" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 transition-colors duration-150">X (Twitter)</a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ReaderLayout;
