import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Tabs,
  Tab,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  IconButton,
  Alert,
} from '@mui/material';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { PageHeader } from '../../../components/common/PageHeader';
import { StatusBadge } from '../../../components/feedback/StatusBadge';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { EmptyState } from '../../../components/common/EmptyState';
import {
  Project,
  ProjectMember,
  ProjectDocument,
  projectsApi,
} from '../api/projectsApi';
import { Employee, employeesApi } from '../../employees/api/employeesApi';
import { ProjectMemberDialog } from '../components/ProjectMemberDialog';
import { DocumentUploadDialog } from '../components/DocumentUploadDialog';
import { useAuth } from '../../auth/context/AuthContext';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // Dialogs
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [docUploadOpen, setDocUploadOpen] = useState(false);
  const [allocationWarning, setAllocationWarning] = useState<string | null>(null);

  const fetchProjectData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [projData, memberData, docData, empData] = await Promise.all([
        projectsApi.getProjectById(id),
        projectsApi.getProjectMembers(id),
        projectsApi.getProjectDocuments(id),
        employeesApi.getEmployees({ limit: 100 }),
      ]);
      setProject(projData);
      setMembers(memberData);
      setDocuments(docData);
      setAllEmployees(empData.employees);
    } catch {
      enqueueSnackbar('Failed to load project details.', { variant: 'error' });
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [id, enqueueSnackbar, navigate]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  const handleAddMember = async (data: Record<string, unknown>) => {
    if (!id) return;
    try {
      const res = await projectsApi.addProjectMember(id, data);
      enqueueSnackbar('Team member assigned successfully.', { variant: 'success' });
      if (res.allocationWarning) {
        setAllocationWarning(res.allocationWarning);
      }
      fetchProjectData();
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { error?: { message?: string } } } };
      enqueueSnackbar(errorResponse?.response?.data?.error?.message || 'Failed to assign member.', {
        variant: 'error',
      });
      throw err;
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!id) return;
    if (window.confirm('Are you sure you want to end-date this member assignment?')) {
      try {
        await projectsApi.removeProjectMember(id, memberId);
        enqueueSnackbar('Member assignment ended successfully (BR-PROJ-004).', { variant: 'success' });
        fetchProjectData();
      } catch {
        enqueueSnackbar('Failed to remove member.', { variant: 'error' });
      }
    }
  };

  const handleUploadDocument = async (formData: FormData) => {
    if (!id) return;
    try {
      await projectsApi.uploadDocument(id, formData);
      enqueueSnackbar('Document uploaded successfully.', { variant: 'success' });
      fetchProjectData();
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { error?: { message?: string } } } };
      enqueueSnackbar(errorResponse?.response?.data?.error?.message || 'Document upload failed.', {
        variant: 'error',
      });
      throw err;
    }
  };

  if (loading || !project) {
    return <LoadingSpinner minHeight="400px" message="Loading project details..." />;
  }

  const isPMorHR =
    user?.roles.includes('HR_ADMIN') ||
    user?.roles.includes('SUPER_ADMIN') ||
    (typeof project.projectManagerId === 'object' && project.projectManagerId?._id === user?._id);

  return (
    <Box>
      <PageHeader
        title={`${project.name} (${project.projectCode})`}
        subtitle={`Client: ${project.client} • Type: ${project.type} • Status: ${project.status}`}
        breadcrumbs={[
          { label: 'Projects', to: '/projects' },
          { label: project.projectCode },
        ]}
        action={<StatusBadge status={project.status} size="medium" />}
      />

      {allocationWarning && (
        <Alert
          severity="warning"
          onClose={() => setAllocationWarning(null)}
          sx={{ mb: 3 }}
        >
          {allocationWarning}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_e, val) => setActiveTab(val)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label="Overview" />
          <Tab label={`Team Members (${members.length})`} />
          <Tab label={`Documents (${documents.length})`} />
        </Tabs>

        {/* Tab 0: Overview */}
        {activeTab === 0 && (
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Project Manager
                </Typography>
                <Typography variant="body1">
                  {project.projectManagerId?.firstName} {project.projectManagerId?.lastName} ({project.projectManagerId?.employeeCode})
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {project.projectManagerId?.email}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Project Lead / Architect
                </Typography>
                <Typography variant="body1">
                  {project.projectLeadId ? `${project.projectLeadId.firstName} ${project.projectLeadId.lastName}` : 'Unassigned'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Billing Model
                </Typography>
                <Chip label={project.billingModel.replace(/_/g, ' ')} color="primary" variant="outlined" />
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Start Date
                </Typography>
                <Typography variant="body1">
                  {new Date(project.startDate).toLocaleDateString()}
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Target End Date
                </Typography>
                <Typography variant="body1">
                  {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Ongoing'}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Project Description
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                  {project.description || 'No detailed description provided.'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        )}

        {/* Tab 1: Team Members */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Typography variant="h6">
                Assigned Team Members
              </Typography>
              {isPMorHR && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PersonAddAltOutlinedIcon />}
                  onClick={() => setMemberDialogOpen(true)}
                >
                  Assign Member
                </Button>
              )}
            </Box>

            {members.length === 0 ? (
              <EmptyState title="No members assigned" description="Assign team members to enable task logging." />
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Project Role</TableCell>
                      <TableCell>Allocation</TableCell>
                      <TableCell>Default Billable</TableCell>
                      <TableCell>Assignment Period</TableCell>
                      {isPMorHR && <TableCell align="right">Action</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {members.map((m) => (
                      <TableRow key={m._id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.8rem' }}>
                              {(m.userId?.firstName?.charAt(0) || m.userId?.email?.charAt(0) || 'U').toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2">
                                {m.userId?.fullName || `${m.userId?.firstName || ''} ${m.userId?.lastName || ''}`.trim() || m.userId?.email || 'Team Member'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {m.userId?.employeeCode ? `${m.userId.employeeCode} • ` : ''}{m.userId?.designation || 'Staff'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{m.projectRole}</TableCell>
                        <TableCell>
                          <Chip
                            label={`${m.allocationPct}%`}
                            size="small"
                            color={m.allocationPct === 100 ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={m.defaultBillable ? 'Billable' : 'Non-Billable'}
                            size="small"
                            color={m.defaultBillable ? 'success' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {new Date(m.startDate).toLocaleDateString()} -{' '}
                            {m.endDate ? new Date(m.endDate).toLocaleDateString() : 'Present'}
                          </Typography>
                        </TableCell>
                        {isPMorHR && (
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveMember(m._id)}
                              title="End assignment"
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* Tab 2: Documents */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Typography variant="h6">
                Project Document Library
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<UploadFileOutlinedIcon />}
                onClick={() => setDocUploadOpen(true)}
              >
                Upload Document
              </Button>
            </Box>

            {documents.length === 0 ? (
              <EmptyState title="No documents uploaded" description="Upload contracts, technical designs, or requirement specifications." />
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Document Title</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Version</TableCell>
                      <TableCell>File Info</TableCell>
                      <TableCell>Uploaded By</TableCell>
                      <TableCell align="right">Download</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc._id}>
                        <TableCell>
                          {doc.title}
                          {doc.description && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {doc.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip label={doc.category} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip label={`v${doc.version}`} size="small" color="primary" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" display="block">
                            {doc.fileName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(doc.fileSize / (1024 * 1024)).toFixed(2)} MB
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {doc.uploadedBy?.firstName} {doc.uploadedBy?.lastName} ({new Date(doc.createdAt).toLocaleDateString()})
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<DownloadOutlinedIcon fontSize="small" />}
                            href={`/api/v1/projects/documents/${doc._id}/download`}
                            target="_blank"
                          >
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </Card>

      {/* Dialogs */}
      <ProjectMemberDialog
        open={memberDialogOpen}
        onClose={() => setMemberDialogOpen(false)}
        onSubmit={handleAddMember}
        employees={allEmployees}
        assignedUserIds={members
          .map((m) =>
            typeof m.userId === 'object' && m.userId ? m.userId._id || m.userId.id || '' : String(m.userId || '')
          )
          .filter((id): id is string => Boolean(id))}
        isInternalProject={project.type === 'INTERNAL'}
      />

      <DocumentUploadDialog
        open={docUploadOpen}
        onClose={() => setDocUploadOpen(false)}
        onUpload={handleUploadDocument}
      />
    </Box>
  );
};
