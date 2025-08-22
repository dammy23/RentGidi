import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from '@/theme/muiTheme';

interface MuiThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const MuiThemeContext = createContext<MuiThemeContextType | undefined>(undefined);

export function useMuiTheme() {
  const context = useContext(MuiThemeContext);
  if (context === undefined) {
    throw new Error('useMuiTheme must be used within a MuiThemeProvider');
  }
  return context;
}

interface MuiThemeProviderProps {
  children: ReactNode;
}

export function MuiThemeProvider({ children }: MuiThemeProviderProps) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem('mui-theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Save theme preference to localStorage
    localStorage.setItem('mui-theme', isDarkMode ? 'dark' : 'light');
    console.log('MuiThemeProvider: Theme changed to', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <MuiThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </MuiThemeContext.Provider>
  );
}