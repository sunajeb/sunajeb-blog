
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
          &copy; {new Date().getFullYear()} Sunaje Bhushan. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default ReaderLayout;
