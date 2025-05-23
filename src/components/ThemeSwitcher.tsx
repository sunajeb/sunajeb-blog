import React, { useState, useEffect } from 'react';

const THEME_KEY = 'theme';
type Theme = 'light' | 'dark';

const ThemeSwitcher: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
    if (storedTheme) {
      return storedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Effect to apply theme to document and save to localStorage
  useEffect(() => {
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, currentTheme);
  }, [currentTheme]);

  // Effect for listening to system theme changes IF no theme is stored in localStorage initially.
  // This ensures that if the user hasn't made an explicit choice, 
  // the theme still respects system changes until a choice is made.
  // Once a choice is made (theme is in localStorage), system changes are ignored by this component.
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      // Only update if no theme choice has been persisted by the user yet
      if (localStorage.getItem(THEME_KEY) === null) {
        const newSystemTheme = mediaQuery.matches ? 'dark' : 'light';
        setCurrentTheme(newSystemTheme);
        // Note: The main useEffect above will handle classList and localStorage for this change.
      }
    };

    // Only add listener if no theme is initially in localStorage
    if (localStorage.getItem(THEME_KEY) === null) {
      mediaQuery.addEventListener('change', handleChange);
    }

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount and cleans up on unmount.


  const toggleTheme = () => {
    setCurrentTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="p-2 rounded-md hover:bg-accent text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {currentTheme === 'light' ? '☀️' : '🌙'}
    </button>
  );
};

export default ThemeSwitcher;
