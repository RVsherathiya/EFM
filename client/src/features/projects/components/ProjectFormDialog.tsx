import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  MenuItem,
  CircularProgress,
  Box,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Project } from '../api/projectsApi';
import { Employee, DepartmentItem } from '../../employees/api/employeesApi';

const projectFormSchema = z.object({
  name: z.string().min(2, 'Project name is required').trim(),
  client: z.string().min(2, 'Client is required').trim(),
  type: z.enum(['CLIENT', 'INTERNAL']),
  billingModel: z.enum(['TIME_AND_MATERIAL', 'FIXED_PRICE', 'NON_BILLABLE']),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  status: z.enum(['PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']),
  projectManagerId: z.string().min(1, 'Project Manager is required'),
  projectLeadId: z.string().optional(),
  departmentId: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

interface ProjectFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  initialData?: Project | null;
  employees: Employee[];
  departments: DepartmentItem[];
}

export const ProjectFormDialog: React.FC<ProjectFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  employees,
  departments,
}) => {
  const isEdit = Boolean(initialData);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: '',
      client: '',
      type: 'CLIENT',
      billingModel: 'TIME_AND_MATERIAL',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      status: 'ACTIVE',
      projectManagerId: '',
      projectLeadId: '',
      departmentId: '',
    },
  });

  const projectType = watch('type');

  useEffect(() => {
    if (projectType === 'INTERNAL') {
      setValue('billingModel', 'NON_BILLABLE');
    }
  }, [projectType, setValue]);

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        client: initialData.client,
        type: initialData.type,
        billingModel: initialData.billingModel,
        description: initialData.description || '',
        startDate: initialData.startDate ? initialData.startDate.split('T')[0] : '',
        endDate: initialData.endDate ? initialData.endDate.split('T')[0] : '',
        status: initialData.status,
        projectManagerId: typeof initialData.projectManagerId === 'object' ? initialData.projectManagerId?._id : (initialData.projectManagerId || ''),
        projectLeadId: typeof initialData.projectLeadId === 'object' ? initialData.projectLeadId?._id : (initialData.projectLeadId || ''),
        departmentId: typeof initialData.departmentId === 'object' ? initialData.departmentId?._id : (initialData.departmentId || ''),
      });
    } else {
      reset({
        name: '',
        client: '',
        type: 'CLIENT',
        billingModel: 'TIME_AND_MATERIAL',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        status: 'ACTIVE',
        projectManagerId: '',
        projectLeadId: '',
        departmentId: '',
      });
    }
  }, [initialData, reset, open]);

  const handleFormSubmit = async (data: ProjectFormData) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEdit ? `Edit Project (${initialData?.projectCode})` : 'Create New Project'}
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent dividers>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Project Name"
                placeholder="e.g. Core Banking Platform Revamp"
                {...register('name')}
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Client / Business Unit"
                placeholder="e.g. Acme Corp"
                {...register('client')}
                error={!!errors.client}
                helperText={errors.client?.message}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <TextField select fullWidth label="Project Type" {...field}>
                    <MenuItem value="CLIENT">Client Project</MenuItem>
                    <MenuItem value="INTERNAL">Internal Project</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="billingModel"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    fullWidth
                    label="Billing Model"
                    disabled={projectType === 'INTERNAL'}
                    {...field}
                  >
                    <MenuItem value="TIME_AND_MATERIAL">Time & Material (T&M)</MenuItem>
                    <MenuItem value="FIXED_PRICE">Fixed Price</MenuItem>
                    <MenuItem value="NON_BILLABLE">Non-Billable</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="projectManagerId"
                control={control}
                render={({ field }) => (
                  <TextField select fullWidth label="Project Manager" {...field} error={!!errors.projectManagerId} helperText={errors.projectManagerId?.message}>
                    <MenuItem value="">Select PM</MenuItem>
                    {employees.map((emp) => (
                      <MenuItem key={emp._id || emp.id} value={emp._id || emp.id}>
                        {emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.email} ({emp.employeeCode || 'No Code'})
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="projectLeadId"
                control={control}
                render={({ field }) => (
                  <TextField select fullWidth label="Project Lead / Architect" {...field}>
                    <MenuItem value="">None</MenuItem>
                    {employees.map((emp) => (
                      <MenuItem key={emp._id || emp.id} value={emp._id || emp.id}>
                        {emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.email} ({emp.employeeCode || 'No Code'})
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="departmentId"
                control={control}
                render={({ field }) => (
                  <TextField select fullWidth label="Department" {...field}>
                    <MenuItem value="">None</MenuItem>
                    {departments.map((dept) => (
                      <MenuItem key={dept._id} value={dept._id}>
                        {dept.name} ({dept.code})
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                {...register('startDate')}
                error={!!errors.startDate}
                helperText={errors.startDate?.message}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                {...register('endDate')}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <TextField select fullWidth label="Status" {...field}>
                    <MenuItem value="PLANNED">Planned</MenuItem>
                    <MenuItem value="ACTIVE">Active</MenuItem>
                    <MenuItem value="ON_HOLD">On Hold</MenuItem>
                    <MenuItem value="COMPLETED">Completed</MenuItem>
                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description & Objectives"
                placeholder="Key deliverables and project scope..."
                {...register('description')}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={22} color="inherit" /> : isEdit ? 'Save Changes' : 'Create Project'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};
