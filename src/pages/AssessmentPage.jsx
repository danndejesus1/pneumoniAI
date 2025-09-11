// src/pages/AssessmentPage.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Divider,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert,
  Avatar,
} from '@mui/material';
import { Person, ReportProblem, LocalHospital } from '@mui/icons-material';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

import DemographicsSection from '../components/forms/DemographicsSection';
import SymptomsSection from '../components/forms/SymptomsSection';
import MedicalHistorySection from '../components/forms/MedicalHistorySection';

const initialForm = {
  fullName: '',
  age: '',
  sex: '',
  contact: '',
  address: '',
  symptoms: {},
  preExisting: [],
  preExistingOther: '',
  medications: '',
  allergies: '',
  smokingStatus: '',
  packYears: '',
  exposureRisks: [],
  additionalConcerns: '',
};

// Top-level SectionCard prevents remounts that caused inputs to lose focus
function SectionCard({ title, subtitle, icon, orange = false, children }) {
  const theme = useTheme();
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: 'visible',
        '&:hover': { boxShadow: '0 10px 30px rgba(2,6,23,0.08)' },
      }}
    >
      <CardContent sx={{ py: 2.5, px: { xs: 2, md: 3 } }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
          <Avatar
            sx={{
              bgcolor: orange ? 'transparent' : theme.palette.primary.light,
              color: orange ? '#fff' : theme.palette.primary.main,
              background: orange ? 'linear-gradient(90deg,#ffb74d,#ff8a65)' : undefined,
              width: 44,
              height: 44,
              boxShadow: orange ? '0 4px 14px rgba(255,138,101,0.18)' : undefined,
            }}
          >
            {icon}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{title}</Typography>
            {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
          </Box>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        {children}
      </CardContent>
    </Card>
  );
}

export default function AssessmentPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
      else {
        setUser(null);
        navigate('/login', { replace: true });
      }
      setChecking(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (form.age === '' || Number.isNaN(Number(form.age)) || Number(form.age) < 0 || Number(form.age) > 120)
      e.age = 'Valid age is required';
    if (!form.sex) e.sex = 'Sex is required';
    if (!form.contact.trim()) e.contact = 'Contact is required';
    if (!form.address.trim()) e.address = 'Address is required';
    if (!Object.values(form.symptoms).some(Boolean))
      e.symptoms = 'Select at least one symptom';
    if (form.smokingStatus === 'current' || form.smokingStatus === 'former') {
      if (form.packYears === '' || Number.isNaN(Number(form.packYears)) || Number(form.packYears) < 0)
        e.packYears = 'Pack-years required';
    }
    if (form.preExisting.includes('Other') && !form.preExistingOther.trim())
      e.preExistingOther = 'Please specify other condition';
    return e;
  };

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // simplified: toggle symptom checkbox only (no severity)
  const handleSymptomChange = (key) => (event) => {
    setForm((prev) => ({
      ...prev,
      symptoms: { ...prev.symptoms, [key]: event.target.checked },
    }));
    setErrors((prev) => ({ ...prev, symptoms: undefined }));
  };

  const handlePreExisting = (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, preExisting: typeof value === 'string' ? value.split(',') : value }));
    setErrors((prev) => ({ ...prev, preExistingOther: undefined }));
  };

  const handleExposure = (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, exposureRisks: typeof value === 'string' ? value.split(',') : value }));
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
      // 1) Create main assessment document with demographics + metadata only
      const mainPayload = {
        fullName: form.fullName || null,
        age: form.age !== '' ? Number(form.age) : null,
        sex: form.sex || null,
        contact: form.contact || null,
        address: form.address || null,
        additionalConcerns: form.additionalConcerns || '',
        submittedBy: user.uid || null,
        submittedByEmail: user.email || null,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'assessments'), mainPayload);

      // 2) Create a diagnosis document inside the new document's `diagnosis` subcollection
      const diagnosisPayload = {
        symptoms: form.symptoms || {},
        preExisting: form.preExisting || [],
        preExistingOther: form.preExisting.includes('Other') ? form.preExistingOther : '',
        medications: form.medications || '',
        allergies: form.allergies || '',
        smokingStatus: form.smokingStatus || '',
        packYears: form.packYears ? Number(form.packYears) : null,
        exposureRisks: form.exposureRisks || [],
        createdAt: serverTimestamp(),
        createdBy: user.uid || null,
      };

      await addDoc(collection(db, 'assessments', docRef.id, 'diagnosis'), diagnosisPayload);

      // 3) Create an xray placeholder document inside `xray` subcollection
      const xrayPlaceholder = {
        placeholder: true,
        notes: 'xray placeholder - no image uploaded yet',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'assessments', docRef.id, 'xray'), xrayPlaceholder);

      setSnackbarMsg('Assessment submitted.');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      // redirect to ResultPage and include the assessment id in location state
      navigate('/result', { state: { assessmentId: docRef.id } });
    } catch (err) {
      console.error('Submission failed', err);
      setSnackbarMsg('Failed to submit assessment.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm(initialForm);
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
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: isMobile ? 3 : 6 }}>
      <Container maxWidth="md">
        {/* subtle orange header stripe to echo homepage accents */}
        <Box
          sx={{
            height: 8,
            borderRadius: 2,
            mb: 3,
            background: 'linear-gradient(90deg, rgba(255,167,38,0.15) 0%, rgba(255,138,101,0.08) 100%)',
          }}
        />

        <Stack spacing={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant={isMobile ? 'h6' : 'h4'} color="primary.dark" sx={{ fontWeight: 800 }}>
                Pneumonia & Respiratory Intake
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                Quick structured intake to capture symptoms and history.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" color="inherit" onClick={() => navigate('/')}>
                Home
              </Button>
              <Button size="small" variant="outlined" color="inherit" onClick={() => signOut(auth)}>
                Sign out
              </Button>
            </Stack>
          </Box>

          {user ? (
            <Typography variant="body2" color="primary">
              Signed in as: {user.email ?? user.displayName ?? 'Unknown'}
            </Typography>
          ) : (
            <Typography color="text.secondary">No user information available.</Typography>
          )}

          {!submitted ? (
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Stack spacing={3}>
                <SectionCard
                  title="Demographics"
                  subtitle="Patient name, age, sex and contact"
                  icon={<Person />}
                  orange={false}
                >
                  <DemographicsSection form={form} errors={errors} handleChange={handleChange} isMobile={isMobile} />
                </SectionCard>

                <SectionCard
                  title="Symptoms"
                  subtitle="Select any symptoms"
                  icon={<ReportProblem />}
                  orange={true}
                >
                  <SymptomsSection
                    form={form}
                    errors={errors}
                    handleSymptomChange={handleSymptomChange}
                  />
                </SectionCard>

                <SectionCard
                  title="Medical History"
                  subtitle="Pre-existing conditions, meds, smoking & exposure"
                  icon={<LocalHospital />}
                  orange={true}
                >
                  <MedicalHistorySection
                    form={form}
                    errors={errors}
                    handlePreExisting={handlePreExisting}
                    handleChange={handleChange}
                    handleExposure={handleExposure}
                    isMobile={isMobile}
                  />
                </SectionCard>

                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    // subtle orange-tinted footer card to match homepage aesthetics
                    background: 'linear-gradient(180deg, rgba(255,250,245,0.6) 0%, rgba(255,255,255,0.8) 100%)',
                  }}
                >
                  <CardContent sx={{ py: 2.5, px: { xs: 2, md: 3 } }}>
                    <TextField
                      label="Additional concerns or comments"
                      value={form.additionalConcerns}
                      onChange={handleChange('additionalConcerns')}
                      multiline
                      rows={3}
                      fullWidth
                    />
                    <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                      <Button type="submit" variant="contained" color="primary" disabled={submitting}>
                        {submitting ? <CircularProgress size={20} /> : 'Submit Assessment'}
                      </Button>
                      <Button variant="outlined" color="inherit" onClick={handleReset} disabled={submitting}>
                        Reset
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </Box>
          ) : (
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent sx={{ py: 3, px: { xs: 2, md: 3 } }}>
                <Stack spacing={2} alignItems="flex-start">
                  <Typography variant="h6" color="primary.dark" fontWeight={700}>Submission received</Typography>
                  <Typography variant="body2" color="text.secondary">The assessment was recorded.</Typography>
                  <Stack direction="row" spacing={2}>
                    <Button variant="contained" onClick={handleReset}>Start another</Button>
                    <Button variant="outlined" onClick={() => navigate('/')}>Back to home</Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Stack>
      </Container>

      <Snackbar open={openSnackbar} autoHideDuration={4000} onClose={() => setOpenSnackbar(false)}>
        <Alert severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}