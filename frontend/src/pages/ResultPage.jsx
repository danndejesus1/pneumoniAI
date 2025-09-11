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
    CircularProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ImageIcon from '@mui/icons-material/Image';
import { useNavigate, useLocation } from 'react-router-dom';
import {useAuth} from '../context/AuthContext.jsx';
import {db} from '../firebase.js';
import {collection, getDocs} from 'firebase/firestore';
import {getPrediction, chatWithBot, generateReport} from '../services/backendApi.js';

export default function ResultPage() {
    const {user, loading} = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const assessmentId = location?.state?.assessmentId ?? null;
    const initialPrediction = location?.state?.predictionFull ?? null;

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login', {replace: true});
        }
    }, [user, loading, navigate]);

    // Simple local chat placeholder state
  const [messages, setMessages] = useState([
    { id: 2, from: 'user', text: 'Hello, I submitted my x‑ray earlier today.' },
  ]);
  const [input, setInput] = useState('');
    const [prediction, setPrediction] = useState(initialPrediction);
    const [predLoading, setPredLoading] = useState(false);
    const [predError, setPredError] = useState(null);
    const [chatLoading, setChatLoading] = useState(false);
    const [chatError, setChatError] = useState(null);
    const [xrayImgUrl, setXrayImgUrl] = useState(null);
    const [reportObj, setReportObj] = useState(location?.state?.reportFull ?? null);
  const listRef = useRef(null);

  // auto-scroll chat to bottom
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

    // Fetch assessment + backend predictionId + xray
    useEffect(() => {
        async function fetchAssessmentAndPrediction() {
            if (!assessmentId) return;
            if (!initialPrediction) setPrediction(null); // only clear if not already supplied
            setXrayImgUrl(null);
            setPredError(null);
            setPredLoading(true);
            try {
                // Only fetch if no full record passed
                if (!initialPrediction) {
                    const subcolSnap = await getDocs(collection(db, 'assessments', assessmentId, 'backendPrediction'));
                    let bpId = null;
                    subcolSnap.forEach((d) => {
                        const val = d.data();
                        if (val.predictionId) bpId = val.predictionId;
                    });
                    if (bpId) {
            try {
                const predRes = await getPrediction(bpId);
                setPrediction(predRes);
            } catch {
                setPredError('Backend prediction not found or failed');
                setPrediction(null);
            }
          }
        }
          // Fetch xray subcollection and grab imageUrl from first doc (if exists)
          const xraySnap = await getDocs(collection(db, 'assessments', assessmentId, 'xray'));
          let imgUrl = null;
          xraySnap.forEach((d) => {
              const val = d.data();
              if (val.imageUrl && !imgUrl) imgUrl = val.imageUrl;
          });
          if (imgUrl) setXrayImgUrl(imgUrl);
      } catch {
          setPredError('Assessment load failed');
      } finally {
          setPredLoading(false);
      }
    }

      fetchAssessmentAndPrediction();
      // eslint-disable-next-line
  }, [assessmentId]);

    // Run report on mount if we have a prediction but no report
    useEffect(() => {
        if (prediction && !reportObj) {
            // Send full prediction JSON for LLM report
            console.log('Calling generateReport with prediction:', prediction);
            generateReport({prediction}).then((res) => {
                console.log('generateReport result:', res);
                setReportObj(res.report || res);
            }).catch((err) => {
                console.error('generateReport failed', err);
                setReportObj(null);
            });
        }
        // eslint-disable-next-line
    }, [prediction]);

    const handleSend = async () => {
    if (!input.trim()) return;
    setMessages((m) => [...m, { id: Date.now(), from: 'user', text: input.trim() }]);
    setInput('');
      setChatLoading(true);
      setChatError(null);
      try {
          const res = await chatWithBot({
              message: input.trim(),
              report: reportObj,
              predictionId: prediction?.id, // Still include if present for compatibility
          });
      setMessages((m) => [
        ...m,
          {id: Date.now() + 1, from: 'system', text: res.answer || 'No reply.'},
      ]);
    } catch (err) {
        setChatError('Chat failed: ' + (err.message || 'Unknown error'));
    } finally {
        setChatLoading(false);
    }
  };

    // Helper to extract structured report fields from reportObj
    function getStructuredReport(reportObj) {
        if (!reportObj) return null;
        if (reportObj.parsed) return reportObj.parsed;
        if (typeof reportObj.raw === 'string') {
            // Remove possible code block markup
            let raw = reportObj.raw.trim();
            if (raw.startsWith('```json')) raw = raw.replace(/^```json/, '').trim();
            if (raw.startsWith('```')) raw = raw.replace(/^```/, '').trim();
            if (raw.endsWith('```')) raw = raw.slice(0, raw.lastIndexOf('```')).trim();
            try {
                return JSON.parse(raw);
            } catch {
        return null;
      }
    }
      return null;
  }

    // Consider data 'ready' only if xrayImgUrl or predError, AND reportObj or predError
    const dataReady = (xrayImgUrl || predError || chatError) && (reportObj || predError || chatError);
    if (!dataReady) {
    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default'
        }}>
            <Stack spacing={2} alignItems="center">
                <CircularProgress size={36}/>
                <Typography color="text.secondary">Loading assessment details…</Typography>
            </Stack>
        </Box>
    );
  }

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

            <Grid container spacing={3} justifyContent="center" alignItems="stretch" sx={{minHeight: {md: 520, xs: 0}}}>
            {/* Left: X-ray image + metadata */}
              <Grid item xs={12} md={4} sx={{display: 'flex', flexDirection: 'column', minHeight: 400}}>
                  <Card variant="outlined" sx={{flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100%'}}>
                      <CardContent sx={{py: 2.5, px: 2, minHeight: 400}}>
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
                      {/* Show image if available */}
                      {xrayImgUrl ? (
                          <img src={xrayImgUrl} alt="X-ray"
                               style={{maxHeight: 320, maxWidth: '96%', borderRadius: 8}}/>
                      ) : (
                          <Stack direction="column" alignItems="center" spacing={1}>
                              <ImageIcon sx={{fontSize: 48, opacity: 0.6}}/>
                              <Typography variant="body2">No image available — x‑ray placeholder</Typography>
                              <Typography variant="caption" color="text.secondary">
                                  The uploaded image will appear here.
                              </Typography>
                          </Stack>
                      )}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                          {/* Show backend report output instead of raw prediction */}
                          {predLoading ? (
                              <Stack spacing={2} sx={{mt: 2}}><CircularProgress
                                  size={28}/><Typography>Fetching…</Typography></Stack>
                          ) : predError ? (
                              <Typography color="error">{predError}</Typography>
                          ) : (reportObj ? (
                              (() => {
                                  const parsed = getStructuredReport(reportObj);
                                  return parsed ? (
                                      <Stack spacing={1} sx={{
                                          mt: 1,
                                          maxWidth: {xs: '100%', md: 400},
                                          minWidth: 0,
                                          wordBreak: 'break-word',
                                          overflowWrap: 'break-word',
                                          whiteSpace: 'pre-wrap'
                                      }}>
                                          <Typography variant="subtitle2">Triage Report:</Typography>
                                          {parsed.summary && (
                                              <Typography variant="body2" sx={{
                                                  wordBreak: 'break-word',
                                                  overflowWrap: 'break-word',
                                                  whiteSpace: 'pre-wrap'
                                              }}><strong>Summary:</strong> {parsed.summary}
                                              </Typography>
                                          )}
                                          {parsed.pneumonia_assessment && (
                                              <Typography variant="body2" sx={{
                                                  wordBreak: 'break-word',
                                                  overflowWrap: 'break-word',
                                                  whiteSpace: 'pre-wrap'
                                              }}><strong>Pneumonia
                                                  Assessment:</strong> {parsed.pneumonia_assessment}</Typography>
                                          )}
                                          {parsed.differential && parsed.differential !== '' && (
                                              <Typography variant="body2" sx={{
                                                  wordBreak: 'break-word',
                                                  overflowWrap: 'break-word',
                                                  whiteSpace: 'pre-wrap'
                                              }}><strong>Differential:</strong> {parsed.differential}
                                              </Typography>
                                          )}
                                          {parsed.next_steps && (
                                              <Typography variant="body2" sx={{
                                                  wordBreak: 'break-word',
                                                  overflowWrap: 'break-word',
                                                  whiteSpace: 'pre-wrap'
                                              }}><strong>Next Steps:</strong> {parsed.next_steps}
                                              </Typography>
                                          )}
                                          {parsed.patient_friendly && (
                                              <Typography
                                                  variant="body2" sx={{
                                                  wordBreak: 'break-word',
                                                  overflowWrap: 'break-word',
                                                  whiteSpace: 'pre-wrap'
                                              }}><strong>Patient-friendly:</strong> {parsed.patient_friendly}
                                              </Typography>
                                          )}
                                          {reportObj.disclaimer && (
                                              <Typography variant="caption"
                                                          color="text.secondary" sx={{
                                                  wordBreak: 'break-word',
                                                  overflowWrap: 'break-word',
                                                  whiteSpace: 'pre-wrap'
                                              }}>{reportObj.disclaimer}</Typography>
                                          )}
                                          {reportObj.context && (
                                              <Typography variant="caption"
                                                          color="text.secondary" sx={{
                                                  wordBreak: 'break-word',
                                                  overflowWrap: 'break-word',
                                                  whiteSpace: 'pre-wrap'
                                              }}>{reportObj.context}</Typography>
                                          )}
                        </Stack>
                      ) : (
                          <Typography variant="body2">Failed to parse structured report.</Typography>
                      );
                    })()
                  ) : (
                      <Stack spacing={1} sx={{mt: 1}}>
                          <CircularProgress size={22}/>
                          <Typography variant="body2" color="text.secondary">Loading report…</Typography>
                      </Stack>
                  ))}
                </CardContent>
              </Card>
            </Grid>

            {/* Right: Chat area */}
                <Grid item xs={12} md={8} sx={{display: 'flex', flexDirection: 'column', minHeight: 400}}>
                    <Card variant="outlined"
                          sx={{flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100%'}}>
                        <CardContent
                            sx={{py: 2.5, px: 2, minHeight: 400, flex: 1, display: 'flex', flexDirection: 'column'}}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                      Chat
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Box
                    ref={listRef}
                    sx={{
                        flex: 1,
                      overflowY: 'auto',
                      pr: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.25,
                      mb: 2,
                        minHeight: 120,
                        maxHeight: {xs: 320, md: 420}
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
                            maxWidth: {xs: '100%', md: 470},
                            minWidth: 0,
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                            whiteSpace: 'pre-wrap',
                        }}
                      >
                          <Typography variant="body2"
                                      sx={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>{m.text}</Typography>
                      </Box>
                    ))}
                  </Box>

                    <Stack direction="row" spacing={1} alignItems="center" sx={{mt: 'auto'}}>
                    <TextField
                        placeholder="Type a message"
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
                      disabled={chatLoading}
                    />
                      <IconButton color="primary" onClick={handleSend} aria-label="send" size="large"
                                  disabled={chatLoading}>
                      <SendIcon />
                    </IconButton>
                  </Stack>
                    {chatLoading &&
                        <Typography variant="caption" color="text.secondary" sx={{mt: 1}}>Sending…</Typography>}
                    {chatError && <Typography variant="caption" color="error" sx={{mt: 1}}>{chatError}</Typography>}
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Note: Chat powered by backend model. For medical advice, consult a physician.
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