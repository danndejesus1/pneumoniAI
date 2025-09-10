import { createTheme } from '@mui/material/styles';

// Create a theme instance for your Pneumonia AI app
export const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Blue - medical/healthcare feel
    },
    secondary: {
      main: '#dc004e', // Red accent
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
  },
  components: {
    // Customize Material UI components here if needed
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Remove uppercase transformation
        },
      },
    },
  },
});
