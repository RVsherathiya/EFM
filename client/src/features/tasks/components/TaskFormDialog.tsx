import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TaskDto } from '../api/tasksApi';

const taskSchema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  workDate: z.string().min(1, 'Work date is required'),
  category: z.string().min(1, 'Category is required'),
  hours: z.number().min(0.25, 'Min hours is 0.25').max(24, 'Max hours is 24'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  dueDate: z.string().optional().nullable(),
  billable: z.boolean().default(true),
  submit: z.boolean().default(false),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<TaskDto> & { submit?: boolean }) => Promise<void>;
  initialData?: TaskDto | null;
  projects: Array<{ _id: string; name: string; projectCode: string; billingModel: string; type: string }>;
}

const CATEGORIES = [
  'Development',
  'Testing',
  'Design',
  'Meeting',
  'Documentation',
  'Support',
  'Training',
  'Other',
];

export const TaskFormDialog: React.FC<TaskFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  projects,
}) => {
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      projectId: '',
      workDate: new Date().toISOString().split('T')[0],
      category: 'Development',
      hours: 1,
      title: '',
      description: '',
      dueDate: '',
      billable: true,
      submit: false,
    },
  });

  const selectedProjectId = watch('projectId');
  const selectedProject = projects.find((p) => p._id === selectedProjectId);

  React.useEffect(() => {
    if (initialData) {
      const projId = typeof initialData.projectId === 'string' ? initialData.projectId : initialData.projectId?._id;
      reset({
        projectId: projId || '',
        workDate: initialData.workDate ? new Date(initialData.workDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        category: initialData.category || 'Development',
        hours: initialData.hours || 1,
        title: initialData.title || '',
        description: initialData.description || '',
        dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
        billable: initialData.isBillable ?? true,
        submit: false,
      });
    } else {
      reset({
        projectId: projects[0]?._id || '',
        workDate: new Date().toISOString().split('T')[0],
        category: 'Development',
        hours: 1,
        title: '',
        description: '',
        dueDate: '',
        billable: true,
        submit: false,
      });
    }
  }, [initialData, projects, reset]);

  // BR-PROJ-003: If internal project, billable is strictly false
  React.useEffect(() => {
    if (selectedProject?.type === 'INTERNAL') {
      setValue('billable', false);
    }
  }, [selectedProject, setValue]);

  const handleFormSubmit = async (data: TaskFormData, submitDirectly: boolean) => {
    setServerError(null);
    try {
      await onSubmit({
        ...data,
        dueDate: data.dueDate ? data.dueDate : null,
        submit: submitDirectly,
      } as any);
      onClose();
    } catch (err: any) {
      setServerError(err?.response?.data?.error?.message || err?.message || 'Failed to save task.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {initialData ? 'Edit Task' : 'Log New Task'}
      </DialogTitle>
      <DialogContent dividers>
        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {serverError}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Controller
            name="projectId"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Project"
                fullWidth
                error={!!errors.projectId}
                helperText={errors.projectId?.message}
                disabled={projects.length === 0}
              >
                {projects.map((p) => (
                  <MenuItem key={p._id} value={p._id}>
                    [{p.projectCode}] {p.name} ({p.type})
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Controller
              name="workDate"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="date"
                  label="Work Date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.workDate}
                  helperText={errors.workDate?.message}
                />
              )}
            />

            <Controller
              name="hours"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="number"
                  label="Hours (0.25 step)"
                  inputProps={{ step: 0.25, min: 0.25, max: 24 }}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  fullWidth
                  error={!!errors.hours}
                  helperText={errors.hours?.message || 'Must be multiple of 0.25 (BR-TASK-001)'}
                />
              )}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Category"
                  fullWidth
                  error={!!errors.category}
                  helperText={errors.category?.message}
                >
                  {CATEGORIES.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Controller
              name="dueDate"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value || ''}
                  type="date"
                  label="Task Due Date (Optional)"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Box>

          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Task Title"
                fullWidth
                error={!!errors.title}
                helperText={errors.title?.message}
              />
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Task Description"
                fullWidth
                multiline
                rows={3}
                error={!!errors.description}
                helperText={errors.description?.message}
              />
            )}
          />

          <Controller
            name="billable"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    disabled={selectedProject?.type === 'INTERNAL'}
                  />
                }
                label={
                  <Typography variant="body2">
                    Mark as Billable Task {selectedProject?.type === 'INTERNAL' && '(Internal projects are always Non-Billable)'}
                  </Typography>
                }
              />
            )}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={handleSubmit((data) => handleFormSubmit(data, false))}
            disabled={isSubmitting}
          >
            Save Draft
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit((data) => handleFormSubmit(data, true))}
            disabled={isSubmitting}
          >
            Submit for Approval
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};
