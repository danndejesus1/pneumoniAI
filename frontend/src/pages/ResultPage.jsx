// src/pages/ResultPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Grid,
  TextField,
  IconButton,
  Divider,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ImageIcon from '@mui/icons-material/Image';
import { useNavigate, useLocation } from 'react-router-dom';
import {useAuth} from '../context/AuthContext.jsx';

export default function ResultPage() {
    const {user, loading} = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const assessmentId = location?.state?.assessmentId ?? null;

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login', {replace: true});
        }
    }, [user, loading, navigate]);

    // Simple local chat placeholder state
  const [messages, setMessages] = useState([
    { id: 1, from: 'system', text: 'This is a placeholder chat. A clinician or bot will appear here.' },
    { id: 2, from: 'user', text: 'Hello, I submitted my x‑ray earlier today.' },
  ]);
  const [input, setInput] = useState('');
  const listRef = useRef(null);

  // auto-scroll chat to bottom
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((m) => [...m, { id: Date.now(), from: 'user', text: input.trim() }]);
    setInput('');
    // placeholder automated reply
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        { id: Date.now() + 1, from: 'system', text: 'Thanks — this is a placeholder reply. Real bot will respond here.' },
      ]);
    }, 600);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 6 }}>
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" color="primary.dark" sx={{ fontWeight: 800 }}>
              Assessment submitted
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Thank you — your assessment has been recorded. 
            </Typography>
            {assessmentId && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Reference ID: <strong>{assessmentId}</strong>
              </Typography>
            )}
          </Box>

            <Grid container spacing={3} justifyContent="center" alignItems="stretch">
            {/* Left: X-ray image + metadata */}
              <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ py: 2.5, px: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Submitted X‑ray
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Box
                    sx={{
                      height: { xs: 240, md: 360 },
                      borderRadius: 1,
                      border: '2px dashed',
                      borderColor: 'grey.300',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'background.paper',
                      color: 'text.secondary',
                      mb: 2,
                    }}
                  >
                    <Stack direction="column" alignItems="center" spacing={1}>
                      <ImageIcon sx={{ fontSize: 48, opacity: 0.6 }} />
                      <Typography variant="body2">No image available — x‑ray placeholder</Typography>
                      <Typography variant="caption" color="text.secondary">
                        The uploaded image will appear here.
                      </Typography>
                    </Stack>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                
                  <Stack spacing={0.5} sx={{ mt: 1 }}>
                  
                   
                    
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Right: Chat area */}
              <Grid item xs={12} md={8}>
              <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ py: 2.5, px: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Chat (placeholder)
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Box
                    ref={listRef}
                    sx={{
                      height: { xs: 320, md: 420 },
                      overflowY: 'auto',
                      pr: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.25,
                      mb: 2,
                    }}
                  >
                    {messages.map((m) => (
                      <Box
                        key={m.id}
                        sx={{
                          alignSelf: m.from === 'user' ? 'flex-end' : 'flex-start',
                          bgcolor: m.from === 'user' ? 'primary.main' : 'grey.100',
                          color: m.from === 'user' ? 'primary.contrastText' : 'text.primary',
                          px: 2,
                          py: 1,
                          borderRadius: 2,
                            maxWidth: '100%',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        }}
                      >
                        <Typography variant="body2">{m.text}</Typography>
                      </Box>
                    ))}
                  </Box>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      placeholder="Type a message (placeholder)"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      size="small"
                      fullWidth
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                    />
                    <IconButton color="primary" onClick={handleSend} aria-label="send" size="large">
                      <SendIcon />
                    </IconButton>
                  </Stack>

                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Note: this is a UI placeholder. The chatbot backend integration will be added later.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* bottom actions */}
          <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => navigate('/assessment')}>
                  Back to assessment
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}