
import { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'dark' | 'light';
  toggleTheme?: () => void;
}

const defaultContext: ThemeContextType = {
  theme: 'dark',
};

const ThemeContext = createContext<ThemeContextType>(defaultContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // In this app we're using dark theme exclusively with no toggle option
  const [theme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    // Apply dark theme to document
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
    document.body.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default useTheme;
