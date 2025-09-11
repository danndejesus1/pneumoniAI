import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  AppBar,
  Toolbar,
  Paper,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Card,
  CardContent,
  Avatar,
  Stack,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Fade,
  Collapse,
  Divider
} from '@mui/material';
import { HealthAndSafety, LockOutlined, VerifiedUser, Speed, Info, SupportAgent } from '@mui/icons-material';

// Theme keeps the same palette / feel as your previous design
const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: { default: '#f5f5f5' },
  },
  typography: {
    h1: { fontWeight: 700 },
  },
});

// small hook to detect when a section is on screen
function useOnScreen(ref, rootMargin = '0px') {
  const [isIntersecting, setIntersecting] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIntersecting(entry.isIntersecting),
      { rootMargin }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, rootMargin]);
  return isIntersecting;
}

function LoginDialog({ open, onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = (e) => {
    e.preventDefault();
    // stubbed - replace with real auth
    console.log('login', { email, password });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Avatar sx={{ bgcolor: 'primary.main' }}><LockOutlined /></Avatar>
          <span>Sign in</span>
        </Stack>
      </DialogTitle>
      <Box component="form" onSubmit={submit}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 320 }}>
          <TextField label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
          <TextField label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">Sign in</Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export default function App() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const heroRef = useRef();
  const featuresRef = useRef();

  const heroOn = useOnScreen(heroRef, '-10%');
  const featuresOn = useOnScreen(featuresRef, '-10%');

  const detailsRef = useRef();

  const openDetails = () => {
    setDetailsOpen(true);
    setTimeout(() => {
      detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', scrollBehavior: 'smooth' }}>
        <AppBar position="static" color="transparent" elevation={0}>
          <Toolbar sx={{ px: { xs: 2, md: 6 } }}>
            <HealthAndSafety sx={{ color: 'primary.main', mr: 1 }} />
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
              Pneumonia AI
            </Typography>
            <Button color="inherit" sx={{ mr: 1 }} href="#features">Features</Button>
            <Button variant="contained" color="primary" startIcon={<LockOutlined />} onClick={() => setLoginOpen(true)}>
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
                    <Button variant="contained" size="large">Get started</Button>
                    <Button
                      variant="outlined"
                      size="large"
                      sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.6)' }}
                      onClick={() => openDetails()}
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

        {/* Non-technical details section (collapsed) */}
        <Box ref={detailsRef}>
          <Collapse in={detailsOpen} timeout="auto" unmountOnExit>
            <Container maxWidth="lg" sx={{ py: 6 }}>
              <Paper elevation={3} sx={{ p: { xs: 3, md: 4 }, borderRadius: 2 }}>
                <Typography variant="h4" gutterBottom>How it works — simple</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  We analyze chest X‑ray images to help flag signs that might indicate pneumonia. Think of it as a second pair of eyes that works quickly and shows where it's looking so clinicians can review the result.
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Upload</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Securely upload an X‑ray image from your computer or hospital system.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Analyze</Typography>
                        <Typography variant="body2" color="text.secondary">
                          The system quickly checks the image and highlights areas it thinks are important, plus a simple confidence score.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Review</Typography>
                        <Typography variant="body2" color="text.secondary">
                          A clinician reviews the suggested findings and decides on next steps — the tool supports, not replaces, clinical judgment.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button onClick={() => closeDetails()}>Close</Button>
                </Box>
              </Paper>
            </Container>
          </Collapse>
        </Box>

        {/* Updated: Vertical card layout matching the image style */}
        <Box component="section" sx={{ py: 6, bgcolor: '#f8f9fa' }}>
          <Container maxWidth="lg">
            <Typography variant="h5" gutterBottom textAlign="center" sx={{ mb: 4 }}>
              More about the project
            </Typography>

            <Grid container spacing={3} alignItems="stretch">
              <Grid item xs={12} sm={6} md={6} sx={{ display: 'flex' }}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    flex: 1,
                    p: 3,
                    textAlign: 'center',
                    bgcolor: 'white',
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ 
                      width: 64, 
                      height: 64, 
                      borderRadius: 2, 
                      bgcolor: '#e3f2fd',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 1
                    }}>
                      <VerifiedUser sx={{ fontSize: 32, color: 'primary.main' }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      Privacy & Security
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      Data is encrypted in transit and at rest, with role-based access and audit logging for clinical workflows.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={6} sx={{ display: 'flex' }}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    flex: 1,
                    p: 3,
                    textAlign: 'center',
                    bgcolor: 'white',
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ 
                      width: 64, 
                      height: 64, 
                      borderRadius: 2, 
                      bgcolor: '#f3e5f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 1
                    }}>
                      <Speed sx={{ fontSize: 32, color: 'secondary.main' }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      Validation & Performance
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      Validated on diverse clinical datasets; inference optimized for low-latency clinical use.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={6} sx={{ display: 'flex' }}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    flex: 1,
                    p: 3,
                    textAlign: 'center',
                    bgcolor: 'white',
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ 
                      width: 64, 
                      height: 64, 
                      borderRadius: 2, 
                      bgcolor: '#e1f5fe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 1
                    }}>
                      <Info sx={{ fontSize: 32, color: 'info.main' }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      Deployment & Integrations
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      Deploy on-prem or in cloud; integrates with PACS and EHR systems via secure APIs and standard export formats.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={6} sx={{ display: 'flex' }}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    flex: 1,
                    p: 3,
                    textAlign: 'center',
                    bgcolor: 'white',
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ 
                      width: 64, 
                      height: 64, 
                      borderRadius: 2, 
                      bgcolor: '#e8f5e8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 1
                    }}>
                      <SupportAgent sx={{ fontSize: 32, color: 'success.main' }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      Support & Docs
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      Comprehensive documentation, deployment guides, and responsive support for clinical teams.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Features */}
        <Box component="main" id="features" ref={featuresRef} sx={{ py: 8, flexGrow: 1 }}>
          <Container maxWidth="lg">
            <Fade in={featuresOn} timeout={700}>
              <Grid container spacing={4} sx={{ alignItems: 'stretch' }}>
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Key features</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Core features (upload, fast inference, clinical security, exportable reports) remain available—cards removed for a simplified layout.
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Fade>
          </Container>
        </Box>

        {/* Footer */}
        <Box component="footer" sx={{ bgcolor: 'grey.50', py: 4 }}>
          <Container maxWidth="lg">
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Pneumonia AI</Typography>
                <Typography variant="body2" color="text.secondary">AI-assisted chest X‑ray analysis · © {new Date().getFullYear()}</Typography>
              </Grid>
              <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                <Link href="#" underline="none" sx={{ mr: 2 }}>Terms</Link>
                <Link href="#" underline="none">Privacy</Link>
              </Grid>
            </Grid>
          </Container>
        </Box>

        <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
      </Box>
    </ThemeProvider>
  );
}
