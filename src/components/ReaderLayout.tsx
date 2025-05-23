
import React from 'react';
import { Link } from 'react-router-dom';
import ThemeSwitcher from '../components/ThemeSwitcher';

interface LayoutProps {
  children: React.ReactNode;
}

const ReaderLayout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background font-['Trebuchet MS', sans-serif]">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <Link to="/read" className="text-2xl font-bold tracking-tight hover:text-accent-foreground transition-colors mb-4 sm:mb-0">
              Blog
            </Link>
            <div className="sm:ml-auto self-end">
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-border mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-muted-foreground text-sm">
          &copy; {new Date().getFullYear()} Sunaje Bhushan. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default ReaderLayout;
