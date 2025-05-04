
import { useState, useEffect, createContext, useContext } from 'react';

type ThemeType = 'dark';

interface ThemeContextType {
  theme: ThemeType;
}

const defaultContext: ThemeContextType = {
  theme: 'dark',
};

const ThemeContext = createContext<ThemeContextType>(defaultContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme] = useState<ThemeType>('dark');

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');

    // Save theme preference
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default useTheme;
