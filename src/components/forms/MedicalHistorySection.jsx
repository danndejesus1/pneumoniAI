import React from 'react';
import { Stack, FormControl, InputLabel, Select, MenuItem, Chip, Box, TextField } from '@mui/material';

const PRE_EXISTING = [
  'Asthma',
  'COPD',
  'Diabetes',
  'Heart Disease',
  'Kidney Disease',
  'Immunosuppression',
  'Cancer',
  'Other',
  'None'
];

const EXPOSURE_RISKS = [
  { key: 'recentContact', label: 'Recent contact with sick person' },
  { key: 'recentTravel', label: 'Recent travel' },
  { key: 'healthcareWorker', label: 'Healthcare worker' },
  { key: 'nursingHome', label: 'Nursing home resident' },
];

export default function MedicalHistorySection({
  form,
  errors,
  handlePreExisting,
  handleChange,
  handleExposure,
  isMobile,
}) {
  return (
    <Stack spacing={3}>
      <Stack direction={isMobile ? 'column' : 'row'} spacing={2} sx={{ alignItems: 'flex-start' }}>
        <FormControl fullWidth>
          <InputLabel id="pre-existing-label">Pre-existing Conditions</InputLabel>
          <Select
            labelId="pre-existing-label"
            label="Pre-existing Conditions"
            multiple
            value={form.preExisting}
            onChange={handlePreExisting}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} />
                ))}
              </Box>
            )}
          >
            {PRE_EXISTING.map((cond) => (
              <MenuItem key={cond} value={cond}>
                {cond}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {form.preExisting.includes('Other') && (
          <TextField
            label="Other condition"
            value={form.preExistingOther}
            onChange={handleChange('preExistingOther')}
            error={!!errors.preExistingOther}
            helperText={errors.preExistingOther}
            fullWidth
          />
        )}
      </Stack>

      <Stack direction={isMobile ? 'column' : 'row'} spacing={2}>
        <TextField
          label="Current medications"
          value={form.medications}
          onChange={handleChange('medications')}
          fullWidth
        />
        <TextField
          label="Allergies"
          value={form.allergies}
          onChange={handleChange('allergies')}
          fullWidth
        />
      </Stack>

      <Stack direction={isMobile ? 'column' : 'row'} spacing={2}>
        <FormControl fullWidth>
          <InputLabel id="smoking-label">Smoking Status</InputLabel>
          <Select
            labelId="smoking-label"
            label="Smoking Status"
            value={form.smokingStatus}
            onChange={handleChange('smokingStatus')}
          >
            <MenuItem value="">Select</MenuItem>
            <MenuItem value="never">Never</MenuItem>
            <MenuItem value="former">Former</MenuItem>
            <MenuItem value="current">Current</MenuItem>
          </Select>
        </FormControl>

        {(form.smokingStatus === 'current' || form.smokingStatus === 'former') && (
          <TextField
            label="Pack-years"
            value={form.packYears}
            onChange={handleChange('packYears')}
            error={!!errors.packYears}
            helperText={errors.packYears}
            type="number"
            inputProps={{ min: 0, step: 0.1 }}
            fullWidth
          />
        )}
      </Stack>

      <FormControl fullWidth>
        <InputLabel id="exposure-label">Recent Exposure Risks</InputLabel>
        <Select
          labelId="exposure-label"
          label="Recent exposure risks — select all that apply"
          multiple
          value={form.exposureRisks}
          onChange={handleExposure}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => (
                <Chip key={value} label={EXPOSURE_RISKS.find((r) => r.key === value)?.label || value} />
              ))}
            </Box>
          )}
        >
          {EXPOSURE_RISKS.map((risk) => (
            <MenuItem key={risk.key} value={risk.key}>
              {risk.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
}