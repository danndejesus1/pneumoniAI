import React from 'react';
import { Box, Stack, FormGroup, FormControlLabel, Checkbox, Typography } from '@mui/material';

const SYMPTOMS = [
  { key: 'cough', label: 'Cough' },
  { key: 'fever', label: 'Fever' },
  { key: 'shortnessOfBreath', label: 'Shortness of Breath' },
  { key: 'chestPain', label: 'Chest Pain' },
  { key: 'fatigue', label: 'Fatigue' },
  { key: 'sputum', label: 'Sputum/Phlegm' },
  { key: 'wheezing', label: 'Wheezing' },
  { key: 'chills', label: 'Chills' },
  { key: 'headache', label: 'Headache' },
  { key: 'muscleAches', label: 'Muscle Aches' },
  { key: 'nausea', label: 'Nausea/Vomiting' },
  { key: 'diarrhea', label: 'Diarrhea' },
];

function SymptomsSection({ form, errors, handleSymptomChange }) {
  return (
    <FormGroup>
      <Stack direction="row" flexWrap="wrap" gap={2}>
        {SYMPTOMS.map((sym) => (
          <Box key={sym.key} sx={{ minWidth: 180 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!form.symptoms[sym.key]}
                  onChange={handleSymptomChange(sym.key)}
                />
              }
              label={sym.label}
            />
          </Box>
        ))}
      </Stack>

      {errors.symptoms && (
        <Typography color="error" variant="caption" sx={{ ml: 1 }}>
          {errors.symptoms}
        </Typography>
      )}
    </FormGroup>
  );
}

export default React.memo(SymptomsSection);