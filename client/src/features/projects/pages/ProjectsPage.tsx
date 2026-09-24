import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Chip,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { PageHeader } from '../../../components/common/PageHeader';
import { StatusBadge } from '../../../components/feedback/StatusBadge';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { EmptyState } from '../../../components/common/EmptyState';
import { Project, projectsApi } from '../api/projectsApi';
import { ProjectFormDialog } from '../components/ProjectFormDialog';
import { Employee, DepartmentItem, employeesApi } from '../../employees/api/employeesApi';
import { useAuth } from '../../auth/context/AuthContext';

export const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);

  const isPMorHR = user?.roles.includes('PM') || user?.roles.includes('HR_ADMIN') || user?.roles.includes('SUPER_ADMIN');

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const data = await projectsApi.getProjects({
        page: page + 1,
        limit: rowsPerPage,
        search: search || undefined,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      });
      setProjects(data.projects);
      setTotal(data.meta.total);
    } catch {
      enqueueSnackbar('Failed to load projects list.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, statusFilter, typeFilter, enqueueSnackbar]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [empData, deptData] = await Promise.all([
          employeesApi.getEmployees({ limit: 100 }),
          employeesApi.getDepartments(),
        ]);
        setEmployees(empData.employees);
        setDepartments(deptData);
      } catch {
        // Ignored
      }
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProjects();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchProjects]);

  const handleCreateProject = async (data: Record<string, unknown>) => {
    try {
      await projectsApi.createProject(data);
      enqueueSnackbar('Project created successfully.', { variant: 'success' });
      setDialogOpen(false);
      fetchProjects();
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { error?: { message?: string } } } };
      enqueueSnackbar(errorResponse?.response?.data?.error?.message || 'Failed to create project.', {
        variant: 'error',
      });
      throw err;
    }
  };

  return (
    <Box>
      <PageHeader
        title="Project Management"
        subtitle="Manage client and internal projects, team assignments, and deliverables."
        action={
          isPMorHR && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
            >
              New Project
            </Button>
          )
        }
      />

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                placeholder="Search by code, project name, client..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="PLANNED">Planned</MenuItem>
                <MenuItem value="ON_HOLD">On Hold</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Project Type"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="CLIENT">Client Project</MenuItem>
                <MenuItem value="INTERNAL">Internal Project</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        {loading ? (
          <LoadingSpinner minHeight="300px" />
        ) : projects.length === 0 ? (
          <EmptyState
            title="No projects found"
            description="Try adjusting your filters or create a new project."
          />
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Project Name</TableCell>
                    <TableCell>Client / Unit</TableCell>
                    <TableCell>Type & Billing</TableCell>
                    <TableCell>Project Manager</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {projects.map((prj) => (
                    <TableRow key={prj._id} hover>
                      <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {prj.projectCode}
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {prj.name}
                        </Typography>
                        {prj.description && (
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 260, display: 'block' }}>
                            {prj.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{prj.client}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Chip
                            label={prj.type}
                            size="small"
                            color={prj.type === 'CLIENT' ? 'primary' : 'default'}
                            variant="outlined"
                          />
                          <Chip
                            label={prj.billingModel.replace(/_/g, ' ')}
                            size="small"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        {prj.projectManagerId ? (
                          <Typography variant="body2">
                            {prj.projectManagerId.firstName} {prj.projectManagerId.lastName}
                          </Typography>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={prj.status} />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<VisibilityOutlinedIcon fontSize="small" />}
                          onClick={() => navigate(`/projects/${prj._id}`)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </>
        )}
      </Card>

      <ProjectFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleCreateProject}
        employees={employees}
        departments={departments}
      />
    </Box>
  );
};
