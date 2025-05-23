import React, { useEffect, useState } from 'react';

const THEME_KEY = 'theme';
type Theme = 'light' | 'dark';

const ThemeSwitcher: React.FC = () => {
  const [selectedTheme, setSelectedTheme] = useState<Theme | 'system'>('system');

  // Apply theme to documentElement
  const applyTheme = (theme: Theme) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Function to handle system theme preference
  const applySystemTheme = () => {
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(systemPrefersDark ? 'dark' : 'light');
  };

  // Effect for initial theme load
  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
    if (storedTheme) {
      applyTheme(storedTheme);
      setSelectedTheme(storedTheme);
    } else {
      applySystemTheme();
      setSelectedTheme('system');
    }
  }, []);

  // Effect for listening to system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (localStorage.getItem(THEME_KEY) === null) { // Only if system is selected
        applySystemTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleSetTheme = (theme: Theme) => {
    applyTheme(theme);
    localStorage.setItem(THEME_KEY, theme);
    setSelectedTheme(theme);
  };

  const handleSetSystem = () => {
    localStorage.removeItem(THEME_KEY);
    applySystemTheme();
    setSelectedTheme('system');
  };

  const buttonStyle = {
    padding: '8px 16px',
    margin: '4px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    cursor: 'pointer',
  };

  const activeButtonStyle = {
    ...buttonStyle,
    borderColor: '#007bff',
    backgroundColor: '#e0e0e0',
  };

  return (
    <div>
      <button
        style={selectedTheme === 'light' ? activeButtonStyle : buttonStyle}
        onClick={() => handleSetTheme('light')}
      >
        Light
      </button>
      <button
        style={selectedTheme === 'dark' ? activeButtonStyle : buttonStyle}
        onClick={() => handleSetTheme('dark')}
      >
        Dark
      </button>
      <button
        style={selectedTheme === 'system' ? activeButtonStyle : buttonStyle}
        onClick={handleSetSystem}
      >
        System
      </button>
    </div>
  );
};

export default ThemeSwitcher;
