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
  IconButton,
  Menu,
  MenuItem as DropdownItem,
  ListItemIcon,
  InputAdornment,
  Chip,
  Avatar,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined';
import { useSnackbar } from 'notistack';
import { PageHeader } from '../../../components/common/PageHeader';
import { StatusBadge } from '../../../components/feedback/StatusBadge';
import { ShimmerTableRows } from '../../../components/common/ShimmerLoader';
import { EmptyState } from '../../../components/common/EmptyState';
import { Employee, DepartmentItem, employeesApi } from '../api/employeesApi';
import { EmployeeFormDialog } from '../components/EmployeeFormDialog';
import { ManagerReassignDialog } from '../components/ManagerReassignDialog';
import { ImportEmployeesDialog } from '../components/ImportEmployeesDialog';
import { useAuth } from '../../auth/context/AuthContext';

export const EmployeesPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  // Dialog States
  const [formOpen, setFormOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // Context Menu State
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeMenuEmployee, setActiveMenuEmployee] = useState<Employee | null>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const data = await employeesApi.getEmployees({
        page: page + 1,
        limit: rowsPerPage,
        search: search || undefined,
        departmentId: selectedDept || undefined,
        role: selectedRole || undefined,
      });
      setEmployees(data.employees);
      setTotal(data.meta.total);
    } catch {
      enqueueSnackbar('Failed to load employees list.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, selectedDept, selectedRole, enqueueSnackbar]);

  const fetchDepartments = async () => {
    try {
      const depts = await employeesApi.getDepartments();
      setDepartments(depts);
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmployees();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchEmployees]);

  const handleCreateOrUpdate = async (data: Record<string, unknown>) => {
    try {
      if (selectedEmployee) {
        await employeesApi.updateEmployee(selectedEmployee._id, data as Partial<Employee>);
        enqueueSnackbar('Employee profile updated successfully.', { variant: 'success' });
      } else {
        await employeesApi.createEmployee(data as Partial<Employee>);
        enqueueSnackbar('New employee created successfully.', { variant: 'success' });
      }
      fetchEmployees();
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { error?: { message?: string } } } };
      enqueueSnackbar(errorResponse?.response?.data?.error?.message || 'Action failed.', {
        variant: 'error',
      });
      throw err;
    }
  };

  const handleManagerReassign = async (employeeId: string, managerId: string | null, reason: string) => {
    await employeesApi.updateManager(employeeId, { managerId, reason });
    enqueueSnackbar('Manager updated and hierarchy recalculation completed.', { variant: 'success' });
    fetchEmployees();
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, emp: Employee) => {
    setMenuAnchorEl(event.currentTarget);
    setActiveMenuEmployee(emp);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setActiveMenuEmployee(null);
  };

  const isHR = currentUser?.roles.includes('HR_ADMIN') || currentUser?.roles.includes('SUPER_ADMIN');

  return (
    <Box>
      <PageHeader
        title="Employee Directory"
        subtitle="Manage organization employees, reporting hierarchy, and roles."
        action={
          isHR && (
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                onClick={() => setImportOpen(true)}
              >
                Import CSV
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setSelectedEmployee(null);
                  setFormOpen(true);
                }}
              >
                New Employee
              </Button>
            </Box>
          )
        }
      />

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                placeholder="Search by name, email, code..."
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
                label="Department"
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All Departments</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept._id} value={dept._id}>
                    {dept.name} ({dept.code})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Role"
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value="EMPLOYEE">Employee</MenuItem>
                <MenuItem value="SENIOR">Senior Manager</MenuItem>
                <MenuItem value="PM">Project Manager</MenuItem>
                <MenuItem value="HR_ADMIN">HR Admin</MenuItem>
                <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        {loading ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Reporting Manager</TableCell>
                  <TableCell>Level</TableCell>
                  <TableCell>Roles</TableCell>
                  <TableCell>Status</TableCell>
                  {isHR && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                <ShimmerTableRows rows={7} columns={isHR ? 8 : 7} hasAvatar={true} />
              </TableBody>
            </Table>
          </TableContainer>
        ) : employees.length === 0 ? (
          <EmptyState
            title="No employees found"
            description="Try adjusting your search criteria or create a new employee."
          />
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Reporting Manager</TableCell>
                    <TableCell>Level</TableCell>
                    <TableCell>Roles</TableCell>
                    <TableCell>Status</TableCell>
                    {isHR && <TableCell align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: '0.85rem' }}>
                            {emp.firstName.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">
                              {emp.fullName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {emp.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>
                        {emp.employeeCode}
                      </TableCell>
                      <TableCell>{emp.departmentId?.name || '-'}</TableCell>
                      <TableCell>
                        {emp.managerId ? (
                          <Typography variant="body2">{emp.managerId.firstName} {emp.managerId.lastName}</Typography>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            (Top Level / CEO)
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={emp.level} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {emp.roles.map((r) => (
                            <Chip key={r} label={r} size="small" />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={emp.status} />
                      </TableCell>
                      {isHR && (
                        <TableCell align="right">
                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, emp)}>
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      )}
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

      {/* Row Actions Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <DropdownItem
          onClick={() => {
            setSelectedEmployee(activeMenuEmployee);
            setFormOpen(true);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Edit Profile
        </DropdownItem>
        <DropdownItem
          onClick={() => {
            setSelectedEmployee(activeMenuEmployee);
            setReassignOpen(true);
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <SwapHorizOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Reassign Manager
        </DropdownItem>
      </Menu>

      {/* Modals */}
      <EmployeeFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialData={selectedEmployee}
        departments={departments}
      />

      <ManagerReassignDialog
        open={reassignOpen}
        onClose={() => setReassignOpen(false)}
        employee={selectedEmployee}
        allManagers={employees}
        onSubmit={handleManagerReassign}
      />

      <ImportEmployeesDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={fetchEmployees}
      />
    </Box>
  );
};
