// src/pages/AssessmentPage.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Stack,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
  Alert,
} from '@mui/material';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

// Firestore imports
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase'; // Ensure `db` is exported from src/firebase.js

export default function AssessmentPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  // Form state
  const [form, setForm] = useState({
    fullName: '',
    age: '',
    sex: '',
    symptoms: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

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
      console.error('Sign-out failed', err);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (form.age === '' || Number.isNaN(Number(form.age)) || Number(form.age) < 0) e.age = 'Valid age is required';
    if (!form.sex) e.sex = 'Sex is required';
    return e;
  };

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    if (!user) {
      setSnackbarMsg('Not signed in.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    setSubmitting(true);
    try {
      // Prepare payload
      const payload = {
        fullName: form.fullName.trim(),
        age: Number(form.age),
        sex: form.sex,
        symptoms: form.symptoms.trim() || null,
        notes: form.notes.trim() || null,
        submittedBy: user.uid || null,
        submittedByEmail: user.email || null,
        createdAt: serverTimestamp(),
      };

      // Write to Firestore
      const docRef = await addDoc(collection(db, 'assessments'), payload);

      console.log('Assessment saved with id:', docRef.id);
      setSnackbarMsg('Assessment submitted.');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      setSubmitted(true);
    } catch (err) {
      console.error('Submission failed', err);
      setSnackbarMsg('Failed to submit assessment. See console for details.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm({ fullName: '', age: '', sex: '', symptoms: '', notes: '' });
    setErrors({});
    setSubmitted(false);
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
          <Stack spacing={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h5">Patient Assessment</Typography>
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined" color="inherit" onClick={() => navigate('/')}>
                  Home
                </Button>
                <Button size="small" variant="outlined" color="inherit" onClick={handleSignOut}>
                  Sign out
                </Button>
              </Stack>
            </Stack>

            <Typography variant="body2" color="text.secondary">
              Fill in the patient's basic information below. Data will be saved to Firestore.
            </Typography>

            {user ? (
              <Typography variant="body2">Signed in as: {user.email ?? user.displayName ?? 'Unknown'}</Typography>
            ) : (
              <Typography color="text.secondary">No user information available.</Typography>
            )}

            {!submitted ? (
              <Box component="form" onSubmit={handleSubmit} noValidate>
                <Stack spacing={2}>
                  <TextField
                    label="Full name"
                    value={form.fullName}
                    onChange={handleChange('fullName')}
                    error={!!errors.fullName}
                    helperText={errors.fullName}
                    required
                    fullWidth
                  />

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label="Age"
                      value={form.age}
                      onChange={handleChange('age')}
                      error={!!errors.age}
                      helperText={errors.age}
                      required
                      type="number"
                      inputProps={{ min: 0 }}
                      fullWidth
                    />

                    <FormControl fullWidth required error={!!errors.sex}>
                      <InputLabel id="sex-label">Sex</InputLabel>
                      <Select
                        labelId="sex-label"
                        label="Sex"
                        value={form.sex}
                        onChange={handleChange('sex')}
                      >
                        <MenuItem value="">Select</MenuItem>
                        <MenuItem value="female">Female</MenuItem>
                        <MenuItem value="male">Male</MenuItem>
                        <MenuItem value="other">Other / Prefer not to say</MenuItem>
                      </Select>
                      {errors.sex ? (
                        <Typography variant="caption" color="error">
                          {errors.sex}
                        </Typography>
                      ) : null}
                    </FormControl>
                  </Stack>

                  <TextField
                    label="Symptoms (comma separated / short description)"
                    value={form.symptoms}
                    onChange={handleChange('symptoms')}
                    multiline
                    rows={3}
                    fullWidth
                  />

                  <TextField
                    label="Additional notes"
                    value={form.notes}
                    onChange={handleChange('notes')}
                    multiline
                    rows={3}
                    fullWidth
                  />

                  <Stack direction="row" spacing={2}>
                    <Button type="submit" variant="contained" color="primary" disabled={submitting}>
                      {submitting ? <CircularProgress size={20} /> : 'Submit Assessment'}
                    </Button>
                    <Button variant="outlined" color="inherit" onClick={handleReset} disabled={submitting}>
                      Reset
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            ) : (
              <Stack spacing={2}>
                <Typography variant="h6">Submission received</Typography>
                <Typography variant="body2" color="text.secondary">
                  The assessment has been recorded to Firestore.
                </Typography>

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2">Submitted patient</Typography>
                  <Typography><strong>Name:</strong> {form.fullName}</Typography>
                  <Typography><strong>Age:</strong> {form.age}</Typography>
                  <Typography><strong>Sex:</strong> {form.sex}</Typography>
                  {form.symptoms ? <Typography><strong>Symptoms:</strong> {form.symptoms}</Typography> : null}
                  {form.notes ? <Typography><strong>Notes:</strong> {form.notes}</Typography> : null}
                </Paper>

                <Stack direction="row" spacing={2}>
                  <Button variant="contained" onClick={handleReset}>Start another assessment</Button>
                  <Button variant="outlined" onClick={() => navigate('/')}>Back to home</Button>
                </Stack>
              </Stack>
            )}

          </Stack>
        </Paper>
      </Container>

      <Snackbar open={openSnackbar} autoHideDuration={4000} onClose={() => setOpenSnackbar(false)}>
        <Alert severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}