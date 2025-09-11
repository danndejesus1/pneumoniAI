import React from 'react';
import { Stack, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

function DemographicsSection({ form, errors, handleChange, isMobile }) {
  // sanitize name: allow letters, spaces, hyphen, apostrophe
  const handleNameChange = (e) => {
    const cleaned = (e.target.value || '').replace(/[^a-zA-Z\s'-]/g, '');
    handleChange('fullName')({ target: { value: cleaned } });
  };

  // sanitize numeric-only fields (strip non-digits)
  const handleContactChange = (e) => {
    const cleaned = (e.target.value || '').replace(/\D/g, '');
    handleChange('contact')({ target: { value: cleaned } });
  };

  const handleAgeChange = (e) => {
    const cleaned = (e.target.value || '').replace(/\D/g, '');
    handleChange('age')({ target: { value: cleaned } });
  };

  return (
    <Stack spacing={3}>
      <Stack direction={isMobile ? 'column' : 'row'} spacing={2} sx={{ alignItems: 'flex-start' }}>
        <TextField
          label="Full name"
          value={form.fullName}
          onChange={handleNameChange}
          error={!!errors.fullName}
          helperText={errors.fullName}
          required
          fullWidth
          inputProps={{ maxLength: 100 }}
        />

        <TextField
          label="Age"
          value={form.age}
          onChange={handleAgeChange}
          error={!!errors.age}
          helperText={errors.age}
          required
          type="text"
          inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', min: 0, max: 120, maxLength: 3 }}
          sx={{ width: { xs: '100%', sm: '30%', md: '20%' } }}
        />

        <FormControl fullWidth sx={{ width: { xs: '100%', sm: '30%', md: '20%' } }} required error={!!errors.sex}>
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
        </FormControl>
      </Stack>

      <Stack direction={isMobile ? 'column' : 'row'} spacing={2}>
        <TextField
          label="Contact number"
          value={form.contact}
          onChange={handleContactChange}
          error={!!errors.contact}
          helperText={errors.contact}
          required
          fullWidth
          type="tel"
          inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 15 }}
          sx={{ width: { xs: '100%', md: '30%' } }}
        />

        <TextField
          label="Address"
          value={form.address}
          onChange={handleChange('address')}
          error={!!errors.address}
          helperText={errors.address}
          required
          fullWidth
        />
      </Stack>
    </Stack>
  );
}

export default React.memo(DemographicsSection);
