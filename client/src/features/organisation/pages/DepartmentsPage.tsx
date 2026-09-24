import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useSnackbar } from 'notistack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '../../../components/common/PageHeader';
import { StatusBadge } from '../../../components/feedback/StatusBadge';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { EmptyState } from '../../../components/common/EmptyState';
import { DepartmentItem, Employee, employeesApi } from '../../employees/api/employeesApi';
import { useAuth } from '../../auth/context/AuthContext';

const deptFormSchema = z.object({
  name: z.string().min(2, 'Department name required'),
  code: z.string().min(2, 'Department code required').max(10).toUpperCase(),
  headId: z.string().optional().nullable(),
  description: z.string().optional(),
});

type DeptFormData = z.infer<typeof deptFormSchema>;

export const DepartmentsPage: React.FC = () => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const isHR = user?.roles.includes('HR_ADMIN') || user?.roles.includes('SUPER_ADMIN');

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DeptFormData>({
    resolver: zodResolver(deptFormSchema),
    defaultValues: {
      name: '',
      code: '',
      headId: '',
      description: '',
    },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptData, empData] = await Promise.all([
        employeesApi.getDepartments(),
        employeesApi.getEmployees({ limit: 100 }),
      ]);
      setDepartments(deptData);
      setEmployees(empData.employees);
    } catch {
      enqueueSnackbar('Failed to load departments.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateDepartment = async (data: DeptFormData) => {
    try {
      await employeesApi.createDepartment({
        name: data.name,
        code: data.code,
        headId: data.headId || null,
        description: data.description,
      });
      enqueueSnackbar('Department created successfully.', { variant: 'success' });
      setDialogOpen(false);
      reset();
      fetchData();
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { error?: { message?: string } } } };
      enqueueSnackbar(errorResponse?.response?.data?.error?.message || 'Failed to create department.', {
        variant: 'error',
      });
    }
  };

  return (
    <Box>
      <PageHeader
        title="Departments"
        subtitle="Manage business units, department codes, and department heads."
        action={
          isHR && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                reset();
                setDialogOpen(true);
              }}
            >
              New Department
            </Button>
          )
        }
      />

      <Card>
        {loading ? (
          <LoadingSpinner minHeight="300px" />
        ) : departments.length === 0 ? (
          <EmptyState
            title="No departments found"
            description="Create departments to categorize projects and team members."
          />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Department Name</TableCell>
                  <TableCell>Department Head</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {departments.map((d) => (
                  <TableRow key={d._id} hover>
                    <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>{d.code}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{d.name}</TableCell>
                    <TableCell>
                      {d.headId ? (
                        <Typography variant="body2">
                          {d.headId.firstName} {d.headId.lastName}
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Unassigned
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', maxWidth: 300 }}>
                      {d.description || '-'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={d.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Create New Department</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(handleCreateDepartment)}>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                fullWidth
                label="Department Name"
                placeholder="e.g. Engineering"
                {...register('name')}
                error={!!errors.name}
                helperText={errors.name?.message}
              />

              <TextField
                fullWidth
                label="Department Code"
                placeholder="e.g. ENG"
                {...register('code')}
                error={!!errors.code}
                helperText={errors.code?.message}
              />

              <Controller
                name="headId"
                control={control}
                render={({ field }) => (
                  <TextField select fullWidth label="Department Head" {...field}>
                    <MenuItem value="">None</MenuItem>
                    {employees.map((emp) => (
                      <MenuItem key={emp._id} value={emp._id}>
                        {emp.fullName} ({emp.employeeCode})
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                placeholder="Department mission and scope..."
                {...register('description')}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setDialogOpen(false)} color="inherit" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={22} color="inherit" /> : 'Create Department'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};
