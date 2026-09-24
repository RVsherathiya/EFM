import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { employeesApi } from '../api/employeesApi';

interface ImportEmployeesDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CSV_HEADER_TEMPLATE = `employeeCode,email,firstName,lastName,designation,level,departmentCode,managerCode,roles`;

export const ImportEmployeesDialog: React.FC<ImportEmployeesDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState<{
    totalRows: number;
    validCount: number;
    errorCount: number;
    errors: Array<{ row: number; employeeCode: string; message: string }>;
    preview?: Array<Record<string, unknown>>;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const parseCsvLines = (text: string) => {
    const lines = text.trim().split('\n').filter((l) => l.trim().length > 0);
    if (lines.length <= 1) return [];

    const headers = lines[0].split(',').map((h) => h.trim());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] || '';
      });
      rows.push(rowObj);
    }
    return rows;
  };

  const handlePreview = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const rows = parseCsvLines(csvText);
      if (rows.length === 0) {
        setErrorMsg('Please enter valid CSV data with header row and at least one employee row.');
        return;
      }
      const res = await employeesApi.importEmployees(rows, false);
      setPreviewResult(res);
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { error?: { message?: string } } } };
      setErrorMsg(errorResponse?.response?.data?.error?.message || 'CSV validation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const rows = parseCsvLines(csvText);
      await employeesApi.importEmployees(rows, true);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { error?: { message?: string } } } };
      setErrorMsg(errorResponse?.response?.data?.error?.message || 'Import commit failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle fontWeight={700}>Import Employees via CSV</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Paste CSV records below. The system will validate duplicate emails, employee codes, levels (L1-L7), and hierarchy cycles before committing.
          </Typography>

          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

          <TextField
            fullWidth
            multiline
            rows={5}
            label="CSV Data"
            value={csvText}
            onChange={(e) => {
              setCsvText(e.target.value);
              setPreviewResult(null);
            }}
            placeholder="Paste CSV rows here..."
            sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
          />

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button variant="outlined" onClick={handlePreview} disabled={loading}>
              {loading && !previewResult ? <CircularProgress size={20} /> : 'Validate & Preview'}
            </Button>
            <Button
              variant="text"
              size="small"
              onClick={() => {
                setCsvText((prev) => (prev ? `${prev}\n${CSV_HEADER_TEMPLATE}` : `${CSV_HEADER_TEMPLATE}\n`));
                setPreviewResult(null);
              }}
            >
              Insert Header Template
            </Button>
          </Box>

          {previewResult && (
            <Box sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 1.5, mb: 2, alignItems: 'center' }}>
                <Chip
                  label={`Total: ${previewResult.totalRows}`}
                  color="default"
                  variant="outlined"
                />
                <Chip
                  label={`Valid: ${previewResult.validCount}`}
                  color="success"
                />
                {previewResult.errorCount > 0 && (
                  <Chip
                    label={`Errors: ${previewResult.errorCount}`}
                    color="error"
                  />
                )}
              </Box>

              {previewResult.errors && previewResult.errors.length > 0 && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Validation Issues Found:
                  </Typography>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {previewResult.errors.map((e, idx) => (
                      <li key={idx}>
                        Row {e.row} ({e.employeeCode}): {e.message}
                      </li>
                    ))}
                  </ul>
                </Alert>
              )}

              {previewResult.preview && previewResult.preview.length > 0 && (
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 240 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Code</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Designation</TableCell>
                        <TableCell>Level</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {previewResult.preview.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ fontWeight: 600 }}>{String(row.employeeCode)}</TableCell>
                          <TableCell>{`${row.firstName} ${row.lastName}`}</TableCell>
                          <TableCell>{String(row.email)}</TableCell>
                          <TableCell>{String(row.designation)}</TableCell>
                          <TableCell>{String(row.level)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleCommit}
          variant="contained"
          disabled={loading || !previewResult || previewResult.errorCount > 0}
        >
          {loading ? <CircularProgress size={22} color="inherit" /> : 'Commit Import'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
