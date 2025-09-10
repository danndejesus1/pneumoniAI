import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  AppBar,
  Toolbar,
  Paper,
  ThemeProvider,
  createTheme,
  CssBaseline
} from '@mui/material';
import {
  HealthAndSafety,
  Psychology,
  CloudUpload,
  Analytics
} from '@mui/icons-material';
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

// Create a custom theme for the medical application
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  const [count, setCount] = useState(0)

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        {/* Header */}
        <AppBar position="static">
          <Toolbar>
            <HealthAndSafety sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Pneumonia AI Detection
            </Typography>
            <Button color="inherit">Login</Button>
          </Toolbar>
        </AppBar>

        {/* Hero Section */}
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Paper
            sx={{
              p: 6,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
              color: 'white',
              textAlign: 'center'
            }}
          >
            <Typography variant="h2" component="h1" gutterBottom>
              AI-Powered Pneumonia Detection
            </Typography>
            <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 4 }}>
              Advanced machine learning for rapid and accurate pneumonia diagnosis
            </Typography>
            <Button
              variant="contained"
              size="large"
              sx={{
                backgroundColor: 'white',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: '#f0f0f0',
                },
              }}
            >
              Get Started
            </Button>
          </Paper>

          {/* Features Section */}
          <Grid container spacing={4} sx={{ mt: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', textAlign: 'center' }}>
                <CardContent>
                  <CloudUpload sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Upload X-Ray
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Securely upload chest X-ray images for analysis
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', textAlign: 'center' }}>
                <CardContent>
                  <Psychology sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    AI Analysis
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Advanced neural networks analyze your images
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', textAlign: 'center' }}>
                <CardContent>
                  <Analytics sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Instant Results
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Get accurate predictions within seconds
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', textAlign: 'center' }}>
                <CardContent>
                  <HealthAndSafety sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Medical Grade
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Clinically validated for healthcare professionals
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* CTA Section */}
          <Paper sx={{ p: 4, mt: 4, textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom>
              Ready to Analyze Your X-Rays?
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Start using our AI-powered pneumonia detection system today
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button variant="contained" size="large">
                Upload X-Ray
              </Button>
              <Button variant="outlined" size="large">
                Learn More
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
