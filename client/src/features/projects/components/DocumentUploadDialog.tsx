import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

interface DocumentUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (formData: FormData) => Promise<void>;
}

const CATEGORIES = [
  'SOW / Contract',
  'Requirements',
  'Design',
  'Technical',
  'Meeting Notes',
  'Other',
];

export const DocumentUploadDialog: React.FC<DocumentUploadDialogProps> = ({
  open,
  onClose,
  onUpload,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Technical');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (open) {
      setTitle('');
      setCategory('Technical');
      setDescription('');
      setFile(null);
      setErrorMsg(null);
    }
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 25 * 1024 * 1024) {
        setErrorMsg('File size exceeds maximum allowed limit of 25MB (Section 22).');
        return;
      }
      setFile(selectedFile);
      if (!title) {
        // Set default title from file name without extension
        const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
        setTitle(baseName);
      }
      setErrorMsg(null);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setErrorMsg('Document title is required.');
      return;
    }
    if (!file) {
      setErrorMsg('Please select a file to upload.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('category', category);
      formData.append('description', description.trim());
      formData.append('file', file);

      await onUpload(formData);
      onClose();
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { error?: { message?: string } } } };
      setErrorMsg(errorResponse?.response?.data?.error?.message || 'File upload failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle fontWeight={700}>Upload Project Document</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Typography variant="body2" color="text.secondary">
            Supported formats: PDF, DOCX, XLSX, PPTX, PNG, JPG, TXT, ZIP (up to 25MB). Uploading a document with an existing title creates a new version.
          </Typography>

          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

          <Box
            sx={{
              p: 3,
              border: '2px dashed #CBD5E1',
              borderRadius: 2,
              textAlign: 'center',
              backgroundColor: '#F8FAFC',
              cursor: 'pointer',
              '&:hover': { borderColor: 'primary.main', backgroundColor: '#F1F5F9' },
            }}
            component="label"
          >
            <input
              type="file"
              hidden
              onChange={handleFileChange}
              accept=".pdf,.docx,.xlsx,.pptx,.png,.jpg,.jpeg,.txt,.zip"
            />
            <UploadFileIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
            <Typography variant="subtitle2" color="text.primary" fontWeight={600}>
              {file ? file.name : 'Click or Drag file to upload'}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'Max size 25MB'}
            </Typography>
          </Box>

          <TextField
            fullWidth
            label="Document Title"
            placeholder="e.g. System Architecture Specification"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <TextField
            select
            fullWidth
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Description (Optional)"
            placeholder="Summary of document purpose or changes in this version..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading || !file}>
          {loading ? <CircularProgress size={22} color="inherit" /> : 'Upload Document'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
