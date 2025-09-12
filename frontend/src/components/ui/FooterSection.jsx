// src/components/ui/FooterSection.jsx
import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Link,
  Paper,
  Tooltip,
  Divider,
  Stack
} from '@mui/material';
import {
  Send,
  Facebook,
  Twitter,
  Instagram,
  LinkedIn,
  Email,
  Phone,
  LocationOn
} from '@mui/icons-material';

export function FooterSection() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      // Reset success message after 3 seconds
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  const socialLinks = [
    { icon: Facebook, label: 'Facebook', url: '#' },
    { icon: Twitter, label: 'Twitter', url: '#' },
    { icon: Instagram, label: 'Instagram', url: '#' },
    { icon: LinkedIn, label: 'LinkedIn', url: '#' }
  ];

  return (
    <Box 
      component="footer" 
      sx={{ 
        background: 'linear-gradient(135deg, #2C3E50 0%, #34495E 100%)',
        color: 'white',
        pt: 6,
        pb: 4,
        borderTop: '3px solid #FF8E53'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Newsletter Section */}
          <Grid item xs={12} md={4}>
            <Box sx={{ position: 'relative' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#FF8E53' }}>
                Stay Connected
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: 'rgba(255,255,255,0.8)' }}>
                Join our newsletter for the latest updates on AI-powered medical diagnostics and exclusive insights.
              </Typography>
              
              {subscribed ? (
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    bgcolor: '#27AE60', 
                    color: 'white',
                    borderRadius: 2
                  }}
                >
                  <Typography variant="body2">
                    ✓ Thank you for subscribing!
                  </Typography>
                </Paper>
              ) : (
                <Box component="form" onSubmit={handleNewsletterSubmit}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    required
                    sx={{ 
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(255,255,255,0.1)',
                        '& fieldset': {
                          borderColor: 'rgba(255,255,255,0.3)',
                        },
                        '&:hover fieldset': {
                          borderColor: '#FF8E53',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#FF8E53',
                        },
                      },
                      '& .MuiInputBase-input': {
                        color: 'white',
                        '&::placeholder': {
                          color: 'rgba(255,255,255,0.7)',
                          opacity: 1,
                        },
                      },
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton 
                            type="submit" 
                            size="small"
                            sx={{
                              bgcolor: '#FF8E53',
                              color: 'white',
                              '&:hover': { 
                                bgcolor: '#FE6B8B',
                                transform: 'scale(1.05)'
                              }
                            }}
                          >
                            <Send fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Box>
              )}
              
              {/* Decorative element */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -10,
                  right: -10,
                  width: 60,
                  height: 60,
                  bgcolor: '#FF8E53',
                  opacity: 0.2,
                  borderRadius: '50%',
                  filter: 'blur(20px)'
                }}
              />
            </Box>
          </Grid>

          {/* Contact Info */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'white' }}>
              Contact Us
            </Typography>
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <LocationOn fontSize="small" sx={{ color: '#FF8E53', mt: 0.5 }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  9F, Lica Malls Shaw, 500 Shaw Blvd,<br />
                  Pleasant Hills, Mandaluyong City, 1552
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone fontSize="small" sx={{ color: '#FF8E53' }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Phone: +63 969 415 1687
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Email fontSize="small" sx={{ color: '#FF8E53' }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  tpmlove@ernihackathon.com
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.2)' }} />

        {/* Bottom Section */}
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              © {new Date().getFullYear()} Pneumonia AI. All rights reserved.
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2} 
              sx={{ textAlign: { xs: 'left', md: 'right' } }}
            >
              {[].map((link) => (
                <Link
                  key={link}
                  href="#"
                  underline="none"
                  sx={{
                    fontSize: '0.875rem',
                    color: 'rgba(255,255,255,0.7)',
                    transition: 'color 0.2s',
                    '&:hover': { color: '#FF8E53' }
                  }}
                >
                  {link}
                </Link>
              ))}
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}