import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Box,
  Typography,
  Avatar,
  Chip,
  Autocomplete,
  Stack,
  ButtonGroup,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import { Employee } from '../../employees/api/employeesApi';

const memberFormSchema = z.object({
  userId: z.string().min(1, 'Please select an employee to assign'),
  projectRole: z.string().min(1, 'Project role is required'),
  allocationPct: z.coerce.number().min(5, 'Minimum 5%').max(100, 'Maximum 100%'),
  defaultBillable: z.boolean().default(true),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
});

export type MemberFormData = z.infer<typeof memberFormSchema>;

interface ProjectMemberDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: MemberFormData) => Promise<void>;
  employees: Employee[];
  assignedUserIds?: string[];
  isInternalProject?: boolean;
}

const COMMON_PROJECT_ROLES = [
  'Tech Lead',
  'Senior Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'QA / Test Engineer',
  'UI/UX Designer',
  'DevOps Engineer',
  'Solution Architect',
  'Business Analyst',
  'Scrum Master',
  'Team Member',
];

export const ProjectMemberDialog: React.FC<ProjectMemberDialogProps> = ({
  open,
  onClose,
  onSubmit,
  employees = [],
  assignedUserIds = [],
  isInternalProject = false,
}) => {
  const [selectedEmp, setSelectedEmp] = React.useState<Employee | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      userId: '',
      projectRole: 'Team Member',
      allocationPct: 100,
      defaultBillable: !isInternalProject,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
    },
  });

  const currentAllocation = watch('allocationPct');

  React.useEffect(() => {
    if (open) {
      setSelectedEmp(null);
      reset({
        userId: '',
        projectRole: 'Team Member',
        allocationPct: 100,
        defaultBillable: !isInternalProject,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
      });
    }
  }, [open, isInternalProject, reset]);

  const getEmpDisplayName = (emp: Employee | null | undefined): string => {
    if (!emp) return '';
    const name = emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.email;
    return `${name} (${emp.employeeCode || 'No Code'})`;
  };

  const handleFormSubmit = async (data: MemberFormData) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
          <PersonAddAlt1Icon fontSize="small" />
        </Avatar>
        <Box>
          <Typography variant="h6">
            Assign Team Member
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Select an employee from directory and configure their role, allocation %, and billability.
          </Typography>
        </Box>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent dividers sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            {/* Employee Autocomplete */}
            <Grid item xs={12}>
              <Controller
                name="userId"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={employees}
                    value={employees.find((e) => e._id === field.value || e.id === field.value) || null}
                    onChange={(_, newValue) => {
                      const newId = newValue ? newValue._id || newValue.id : '';
                      field.onChange(newId);
                      setSelectedEmp(newValue);
                      if (newValue?.designation && !watch('projectRole')) {
                        setValue('projectRole', newValue.designation);
                      }
                    }}
                    getOptionLabel={(option) => getEmpDisplayName(option)}
                    isOptionEqualToValue={(option, val) => (option._id || option.id) === (val._id || val.id)}
                    getOptionDisabled={(option) => assignedUserIds.includes(option._id) || assignedUserIds.includes(option.id)}
                    renderOption={(props, option) => {
                      const { key, ...restProps } = props;
                      const isAssigned = assignedUserIds.includes(option._id) || assignedUserIds.includes(option.id);
                      const name = option.fullName || `${option.firstName || ''} ${option.lastName || ''}`.trim() || option.email;
                      const dept = typeof option.departmentId === 'object' && option.departmentId ? option.departmentId.name : null;

                      return (
                        <Box
                          component="li"
                          key={key}
                          {...restProps}
                          sx={{
                            p: '10px 14px !important',
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            opacity: isAssigned ? 0.55 : 1,
                          }}
                        >
                          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '100%' }}>
                            <Avatar
                              sx={{
                                width: 36,
                                height: 36,
                                fontSize: '0.85rem',
                                bgcolor: isAssigned ? 'grey.500' : 'primary.main',
                              }}
                            >
                              {(option.firstName?.charAt(0) || option.email?.charAt(0) || 'E').toUpperCase()}
                            </Avatar>
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                              <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                                <Typography variant="subtitle2" noWrap>
                                  {name}
                                </Typography>
                                <Chip
                                  size="small"
                                  variant="outlined"
                                  label={option.employeeCode}
                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                                {option.level && (
                                  <Chip
                                    size="small"
                                    color="secondary"
                                    variant="outlined"
                                    label={option.level}
                                    sx={{ fontSize: '0.68rem', height: 20 }}
                                  />
                                )}
                                {isAssigned && (
                                  <Chip
                                    size="small"
                                    color="warning"
                                    label="Already Assigned"
                                    sx={{ fontSize: '0.68rem', height: 20 }}
                                  />
                                )}
                              </Stack>
                              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mt: 0.3 }}>
                                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                  <BadgeOutlinedIcon sx={{ fontSize: 13 }} />
                                  {option.designation || 'Specialist'}
                                </Typography>
                                {dept && (
                                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                    <BusinessOutlinedIcon sx={{ fontSize: 13 }} />
                                    {dept}
                                  </Typography>
                                )}
                              </Stack>
                            </Box>
                          </Stack>
                        </Box>
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Employee"
                        placeholder="Search employee by name, code, designation..."
                        error={!!errors.userId}
                        helperText={errors.userId?.message || 'Select an active employee to add to the project.'}
                      />
                    )}
                  />
                )}
              />
            </Grid>

            {/* Selected Employee Summary Card (if selected) */}
            {selectedEmp && (
              <Grid item xs={12}>
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: 'action.hover',
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.dark' }}>
                      {(selectedEmp.firstName?.charAt(0) || 'U').toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">
                        {selectedEmp.fullName || `${selectedEmp.firstName || ''} ${selectedEmp.lastName || ''}`.trim()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedEmp.email} • {selectedEmp.employeeCode} • {selectedEmp.designation}
                      </Typography>
                    </Box>
                  </Stack>
                  <Chip label="Ready to Assign" color="success" size="small" variant="filled" />
                </Box>
              </Grid>
            )}

            {/* Project Role */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="projectRole"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    freeSolo
                    options={COMMON_PROJECT_ROLES}
                    value={field.value}
                    onInputChange={(_, newValue) => field.onChange(newValue)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Project Role"
                        placeholder="e.g. Lead QA Engineer"
                        error={!!errors.projectRole}
                        helperText={errors.projectRole?.message || 'Select or type custom role'}
                      />
                    )}
                  />
                )}
              />
            </Grid>

            {/* Allocation % and Presets */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Allocation Percentage (%)"
                type="number"
                inputProps={{ min: 5, max: 100, step: 5 }}
                {...register('allocationPct')}
                error={!!errors.allocationPct}
                helperText={errors.allocationPct?.message || 'Standard allocation capacity (5% - 100%)'}
              />
              <Stack direction="row" spacing={1} sx={{ mt: 1 }} alignItems="center">
                <Typography variant="caption" color="text.secondary">Quick Set:</Typography>
                <ButtonGroup size="small" variant="outlined">
                  {[25, 50, 75, 100].map((pct) => (
                    <Button
                      key={pct}
                      variant={currentAllocation === pct ? 'contained' : 'outlined'}
                      onClick={() => setValue('allocationPct', pct)}
                      sx={{ py: 0.2, px: 1, fontSize: '0.72rem' }}
                    >
                      {pct}%
                    </Button>
                  ))}
                </ButtonGroup>
              </Stack>
            </Grid>

            {/* Start Date */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Assignment Start Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                {...register('startDate')}
                error={!!errors.startDate}
                helperText={errors.startDate?.message}
              />
            </Grid>

            {/* End Date */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Assignment End Date (Optional)"
                type="date"
                InputLabelProps={{ shrink: true }}
                {...register('endDate')}
                helperText="Leave empty for ongoing indefinite assignment"
              />
            </Grid>

            {/* Default Billable */}
            <Grid item xs={12}>
              <Controller
                name="defaultBillable"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={field.value}
                        onChange={field.onChange}
                        disabled={isInternalProject}
                      />
                    }
                    label={
                      isInternalProject
                        ? 'Default Non-Billable (Internal Project Rule BR-PROJ-003)'
                        : 'Default tasks logged by this member will be marked Billable'
                    }
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
          <Button onClick={onClose} color="inherit" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <PersonAddAlt1Icon />}
          >
            {isSubmitting ? 'Assigning...' : 'Assign Member'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};
