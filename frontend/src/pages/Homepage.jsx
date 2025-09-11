import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
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
  Collapse,
    Divider,
    CircularProgress
} from '@mui/material';
import { LockOutlined, VerifiedUser, Speed, Info, SupportAgent } from '@mui/icons-material';
import { FooterSection } from '../components/ui/FooterSection.jsx';
import { HeaderSection } from '../components/ui/HeaderSection.jsx';
import { useNavigate } from 'react-router-dom';
import {useAuth} from '../context/AuthContext.jsx';

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
    const {user, loading} = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const heroRef = useRef();
    // const featuresRef = useRef();

  const heroOn = useOnScreen(heroRef, '-10%');
    // const featuresOn = useOnScreen(featuresRef, '-10%');

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

  const navigate = useNavigate();

    useEffect(() => {
        if (!loading && user) {
            navigate('/assessment', {replace: true});
        }
    }, [user, loading, navigate]);

    if (loading) {
        return (
            <Box sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default'
            }}>
                <CircularProgress size={48} color="primary"/>
            </Box>
        );
    }
    return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', scrollBehavior: 'smooth' }}>
        <HeaderSection
          heroRef={heroRef}
          heroOn={heroOn}
          onOpenDetails={openDetails}
          onOpenLogin={() => setLoginOpen(true)}
        />

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

        {/* Key Features Grid Cards :) */}
        <Box component="section" sx={{ py: 6, bgcolor: '#f8f9fa' }}>
          <Container maxWidth="lg">
            <Typography variant="h5" gutterBottom textAlign="center" sx={{ mb: 4 }}>
              Key Features
            </Typography>

            <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
              {[
                { icon: VerifiedUser, title: 'Privacy & Security', desc: 'Data is encrypted in transit and at rest, with role-based access and audit logging for clinical workflows.', color: '#e3f2fd' },
                { icon: Speed, title: 'Fast Analysis', desc: 'Quick chest X-ray analysis with optimized inference for clinical decision support.', color: '#f3e5f5' },
                { icon: Info, title: 'Easy Integration', desc: 'Seamless use of features only requiring a few quick submissions', color: '#e1f5fe' },
                { icon: SupportAgent, title: 'AI Powered Assessments', desc: 'Comprehensive assessments and responsive support designed specifically for clinical teams through utilization of AI.', color: '#e8f5e8' }
              ].map((feature, index) => (
                <Box key={index} sx={{ display: 'flex' }}>
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
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                      }
                    }}
                  >
                    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <Box sx={{
                        width: 64,
                        height: 64,
                        borderRadius: 2,
                        bgcolor: feature.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 1
                      }}>
                        <feature.icon sx={{ fontSize: 32, color: 'primary.main' }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        {feature.desc}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
          </Container>
        </Box>

        {}
        <FooterSection />

        <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
      </Box>
    </ThemeProvider>
  );
}
