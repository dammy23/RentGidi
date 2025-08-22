import { createTheme, ThemeOptions } from '@mui/material/styles';

// Define color palette
const lightPalette = {
  primary: {
    main: '#2563eb', // Blue-600
    light: '#3b82f6', // Blue-500
    dark: '#1d4ed8', // Blue-700
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#7c3aed', // Purple-600
    light: '#8b5cf6', // Purple-500
    dark: '#6d28d9', // Purple-700
    contrastText: '#ffffff',
  },
  error: {
    main: '#dc2626', // Red-600
    light: '#ef4444', // Red-500
    dark: '#b91c1c', // Red-700
    contrastText: '#ffffff',
  },
  warning: {
    main: '#d97706', // Amber-600
    light: '#f59e0b', // Amber-500
    dark: '#b45309', // Amber-700
    contrastText: '#ffffff',
  },
  success: {
    main: '#059669', // Emerald-600
    light: '#10b981', // Emerald-500
    dark: '#047857', // Emerald-700
    contrastText: '#ffffff',
  },
  background: {
    default: '#f8fafc', // Slate-50
    paper: '#ffffff',
  },
  text: {
    primary: '#0f172a', // Slate-900
    secondary: '#64748b', // Slate-500
  },
};

const darkPalette = {
  primary: {
    main: '#3b82f6', // Blue-500
    light: '#60a5fa', // Blue-400
    dark: '#2563eb', // Blue-600
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#8b5cf6', // Purple-500
    light: '#a78bfa', // Purple-400
    dark: '#7c3aed', // Purple-600
    contrastText: '#ffffff',
  },
  error: {
    main: '#ef4444', // Red-500
    light: '#f87171', // Red-400
    dark: '#dc2626', // Red-600
    contrastText: '#ffffff',
  },
  warning: {
    main: '#f59e0b', // Amber-500
    light: '#fbbf24', // Amber-400
    dark: '#d97706', // Amber-600
    contrastText: '#000000',
  },
  success: {
    main: '#10b981', // Emerald-500
    light: '#34d399', // Emerald-400
    dark: '#059669', // Emerald-600
    contrastText: '#ffffff',
  },
  background: {
    default: '#0f172a', // Slate-900
    paper: '#1e293b', // Slate-800
  },
  text: {
    primary: '#f1f5f9', // Slate-100
    secondary: '#94a3b8', // Slate-400
  },
};

// Common theme options
const commonThemeOptions: ThemeOptions = {
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.25rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '1.875rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
    },
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
          padding: '8px 16px',
          transition: 'all 0.2s ease-in-out',
        },
        contained: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          borderRadius: 12,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        },
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          '& .MuiAlert-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
};

// Create light theme
export const lightTheme = createTheme({
  ...commonThemeOptions,
  palette: {
    mode: 'light',
    ...lightPalette,
  },
});

// Create dark theme
export const darkTheme = createTheme({
  ...commonThemeOptions,
  palette: {
    mode: 'dark',
    ...darkPalette,
  },
});

// Theme type for TypeScript
export type AppTheme = typeof lightTheme;