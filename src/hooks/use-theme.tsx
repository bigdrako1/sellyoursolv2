
import { createContext, useContext, useEffect } from 'react';

interface ThemeContextType {
  theme: 'dark';
}

const defaultContext: ThemeContextType = {
  theme: 'dark',
};

const ThemeContext = createContext<ThemeContextType>(defaultContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Always use dark theme
  const theme = 'dark';

  useEffect(() => {
    // Apply dark theme to document
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
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
