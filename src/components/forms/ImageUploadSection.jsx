import React, {useRef} from 'react';
import {Box, Typography, Button, LinearProgress, Stack, IconButton, Alert} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import DeleteIcon from '@mui/icons-material/Delete';

export default function ImageUploadSection({
                                               file,
                                               preview,
                                               progress,
                                               uploadError,
                                               disabled,
                                               onFileChange,
                                               onRemove
                                           }) {
    const inputRef = useRef();

    const handleFileInput = (e) => {
        const selectedFile = e.target.files && e.target.files[0];
        if (selectedFile) {
            onFileChange(selectedFile);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files && e.dataTransfer.files[0];
        if (droppedFile) {
            onFileChange(droppedFile);
        }
    };

    return (
        <Box>
            <Typography variant="body1" sx={{mb: 1}}>
                Upload Chest X-ray Image
            </Typography>
            <Box
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                sx={{
                    minHeight: 180,
                    border: '2px dashed',
                    borderColor: 'grey.300',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'background.paper',
                    color: 'text.secondary',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    mb: 2,
                    transition: 'border-color 0.2s',
                    position: 'relative'
                }}
                onClick={() => !disabled && inputRef.current && inputRef.current.click()}
            >
                {preview ? (
                    <Box sx={{position: 'relative', width: '100%', textAlign: 'center'}}>
                        <img src={preview} alt="X-ray preview"
                             style={{maxHeight: 160, maxWidth: '96%', borderRadius: 8}}/>
                        <IconButton
                            aria-label="Remove"
                            onClick={e => {
                                e.stopPropagation();
                                onRemove();
                            }}
                            sx={{position: 'absolute', top: 8, right: 8, bgcolor: 'white', zIndex: 1}}
                            size="small"
                            disabled={disabled}
                        >
                            <DeleteIcon fontSize="small"/>
                        </IconButton>
                    </Box>
                ) : (
                    <Stack alignItems="center" spacing={1}>
                        <ImageIcon sx={{fontSize: 40, opacity: 0.6}}/>
                        <Typography variant="body2">Drag and drop, or click to select x-ray file</Typography>
                        <Typography variant="caption" color="text.secondary">JPG, PNG or DICOM. Max 10MB.</Typography>
                    </Stack>
                )}
                <input
                    ref={inputRef}
                    type="file"
                    hidden
                    accept="image/*,.dcm"
                    onChange={handleFileInput}
                    disabled={disabled}
                />
            </Box>
            {progress > 0 && progress < 100 && (
                <LinearProgress variant="determinate" value={progress} sx={{mb: 2}}/>
            )}
            {uploadError && <Alert severity="error" sx={{my: 1}}>{uploadError}</Alert>}
            {file && (
                <Typography variant="caption" color="text.secondary">
                    Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </Typography>
            )}
        </Box>
    );
}
