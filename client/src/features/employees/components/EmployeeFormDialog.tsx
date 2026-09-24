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
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Chip,
  Box,
  CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Employee, DepartmentItem } from '../api/employeesApi';

const employeeFormSchema = z.object({
  employeeCode: z.string().min(2, 'Employee code required').toUpperCase(),
  email: z.string().email('Valid email required'),
  password: z.string().optional(),
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  designation: z.string().min(1, 'Designation required'),
  level: z.enum(['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7']),
  departmentId: z.string().optional(),
  roles: z.array(z.string()).min(1, 'At least one role required'),
  phone: z.string().optional(),
});

type EmployeeFormData = z.infer<typeof employeeFormSchema>;

interface EmployeeFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: EmployeeFormData) => Promise<void>;
  initialData?: Employee | null;
  departments: DepartmentItem[];
}

const ALL_ROLES = ['EMPLOYEE', 'SENIOR', 'PM', 'HR_ADMIN', 'SUPER_ADMIN'];

export const EmployeeFormDialog: React.FC<EmployeeFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  departments,
}) => {
  const isEdit = Boolean(initialData);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      employeeCode: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      designation: '',
      level: 'L1',
      departmentId: '',
      roles: ['EMPLOYEE'],
      phone: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        employeeCode: initialData.employeeCode,
        email: initialData.email,
        firstName: initialData.firstName,
        lastName: initialData.lastName,
        designation: initialData.designation,
        level: initialData.level as 'L1',
        departmentId: typeof initialData.departmentId === 'object' ? initialData.departmentId?._id : (initialData.departmentId || ''),
        roles: initialData.roles || ['EMPLOYEE'],
        phone: initialData.phone || '',
      });
    } else {
      reset({
        employeeCode: '',
        email: '',
        password: 'Password@123',
        firstName: '',
        lastName: '',
        designation: '',
        level: 'L1',
        departmentId: '',
        roles: ['EMPLOYEE'],
        phone: '',
      });
    }
  }, [initialData, reset, open]);

  const handleFormSubmit = async (data: EmployeeFormData) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle fontWeight={700}>
        {isEdit ? `Edit Employee (${initialData?.employeeCode})` : 'Create New Employee'}
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent dividers>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Employee Code"
                disabled={isEdit}
                {...register('employeeCode')}
                error={!!errors.employeeCode}
                helperText={errors.employeeCode?.message}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                disabled={isEdit}
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            </Grid>

            {!isEdit && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Initial Password"
                  type="password"
                  {...register('password')}
                  error={!!errors.password}
                  helperText={errors.password?.message || 'Default: Password@123'}
                />
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                {...register('firstName')}
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                {...register('lastName')}
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Designation"
                placeholder="e.g. Senior Software Engineer"
                {...register('designation')}
                error={!!errors.designation}
                helperText={errors.designation?.message}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="level"
                control={control}
                render={({ field }) => (
                  <TextField select fullWidth label="Designation Level" {...field}>
                    {['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7'].map((lvl) => (
                      <MenuItem key={lvl} value={lvl}>
                        {lvl}
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

            <Grid item xs={12} sm={6}>
              <Controller
                name="roles"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth size="small">
                    <InputLabel id="roles-label">System Roles</InputLabel>
                    <Select
                      labelId="roles-label"
                      multiple
                      value={field.value}
                      onChange={field.onChange}
                      input={<OutlinedInput label="System Roles" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((val) => (
                            <Chip key={val} label={val} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      {ALL_ROLES.map((role) => (
                        <MenuItem key={role} value={role}>
                          {role}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={22} color="inherit" /> : isEdit ? 'Save Changes' : 'Create Employee'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};
