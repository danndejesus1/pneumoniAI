import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  AppBar,
  Toolbar,
  Fade,
  Stack,
  Avatar
} from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import LogoImg from '../../assets/tpmheader.png';
import { useNavigate } from 'react-router-dom';

export function HeaderSection({ heroRef, heroOn, onOpenDetails, onLoginOpen }) {
  const navigate = useNavigate();

  const handleLogin = () => {
    // use router navigation for a proper animated route transition
    navigate('/login');
  };

  return (
    <>
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar sx={{ px: { xs: 2, md: 6 } }}>
          <Box
            onClick={() => navigate('/')}
            sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', flexGrow: 1 }}
          >
            <Box component="img" src={LogoImg} alt="PneumoniAI logo" sx={{ height: 36 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'inherit' }}>
              PneumoniAI
            </Typography>
          </Box>
          <Button color="inherit" sx={{ mr: 1 }} href="#features"></Button>
          <Button variant="contained" color="primary" startIcon={<LockOutlined />} onClick={handleLogin}>
            Login
          </Button>
        </Toolbar>
      </AppBar>

      {/* Hero */}
      <Box component="header" ref={heroRef} sx={{ background: 'linear-gradient(135deg,#FE6B8B 10%,#FF8E53 100%)', color: 'white', py: { xs: 6, md: 10 } }}>
        <Container maxWidth="lg">
          <Fade in={heroOn} timeout={600}>
            <Grid container spacing={4} alignItems="center" justifyContent="center">
              <Grid item xs={12} md={8}>
                <Typography variant="h2" component="h1" gutterBottom>
                  AI-powered Pneumonia detection for clinicians
                </Typography>
                <Typography variant="h6" sx={{ mb: 3, opacity: 0.95 }}>
                  Rapid, explainable chest X‑ray analysis built for hospitals and research teams.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button variant="contained" size="large" onClick={handleLogin}>Get started</Button>
                  <Button
                    variant="outlined"
                    size="large"
                    sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.6)' }}
                    onClick={onOpenDetails}
                  >
                    Learn more
                  </Button>
                </Stack>
                <Stack direction="row" spacing={3} sx={{ mt: 4 }}>
                  <Stack spacing={0.5}>
                    <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>Trusted by</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ bgcolor: 'white', color: 'primary.main', width: 28, height: 28 }}>T</Avatar>
                      <Avatar sx={{ bgcolor: 'white', color: 'primary.main', width: 28, height: 28 }}>P</Avatar>
                      <Avatar sx={{ bgcolor: 'white', color: 'primary.main', width: 28, height: 28 }}>M</Avatar>
                    </Stack>
                  </Stack>
                </Stack>
              </Grid>
            </Grid>
          </Fade>
        </Container>
      </Box>
    </>
  );
}