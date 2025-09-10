// src/pages/AssessmentPage.jsx
import React, { useEffect, useState } from 'react';
import { Box, Container, Paper, Typography, Button, CircularProgress, Stack } from '@mui/material';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

export default function AssessmentPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Subscribe to auth state; redirect to /login if not signed in
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
      } else {
        setUser(null);
        navigate('/login', { replace: true });
      }
      setChecking(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login', { replace: true });
    } catch (err) {
      // You may want to surface errors to the user in a real app
      console.error('Sign-out failed', err);
    }
  };

  if (checking) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 6 }}>
      <Container maxWidth="md">
        <Paper elevation={6} sx={{ p: { xs: 3, md: 5 }, borderRadius: 2 }}>
          <Stack spacing={2}>
            <Typography variant="h5">Assessment — Placeholder</Typography>
            <Typography variant="body2" color="text.secondary">
              This is a placeholder assessment page. Replace this UI with the actual assessment flow.
            </Typography>

            {user ? (
              <>
                <Typography variant="body1">Signed in as: {user.email ?? user.displayName ?? 'Unknown'}</Typography>
                <Stack direction="row" spacing={2}>
                  <Button variant="contained" color="primary" onClick={() => {/* navigate to actual assessment flow here */}}>
                    Start Assessment
                  </Button>
                  <Button variant="outlined" color="inherit" onClick={handleSignOut}>
                    Sign out
                  </Button>
                </Stack>
              </>
            ) : (
              <Typography color="text.secondary">No user information available.</Typography>
            )}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}