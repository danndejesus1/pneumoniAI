// src/pages/Login.jsx
import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  createTheme,
  ThemeProvider,
  CssBaseline,
  Avatar,
  TextField,
  Stack,
  Link,
  Alert,
  CircularProgress
} from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    background: { default: '#f5f5f5' },
  },
  typography: {
    h5: { fontWeight: 700 },
  },
});

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // On success, navigate to the protected assessment page
      navigate('/assessment');
    } catch (err) {
      // Show a simple, helpful message
      setError(err?.message ?? 'Failed to sign in. Please check credentials.');
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', bgcolor: 'background.default', py: 6 }}>
        <Container maxWidth="sm">
          <Paper elevation={6} sx={{ p: { xs: 3, md: 5 }, borderRadius: 2 }}>
            <Stack spacing={2} alignItems="center" sx={{ mb: 1 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <LockOutlined />
              </Avatar>
              <Typography variant="h5">Employee sign in</Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Minimal, secure access for staff. Use your employee credentials.
              </Typography>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box component="form" onSubmit={submit} sx={{ display: 'grid', gap: 2 }}>
              <TextField
                label="Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                autoComplete="email"
              />
              <TextField
                label="Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                autoComplete="current-password"
              />

              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{ py: 1.25 }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : 'Sign in'}
              </Button>

              <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                <Link component="button" variant="body2" onClick={() => navigate('/')}>
                  Back to home
                </Link>
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => {
                    // Could route to a small "forgot" flow or show a reset instructions page
                    // For now, take to homepage so staff can ask admin to reset
                    navigate('/');
                  }}
                >
                  Forgot password?
                </Link>
              </Stack>
            </Box>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}