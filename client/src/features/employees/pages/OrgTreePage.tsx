import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Collapse,
  IconButton,
  Paper,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { PageHeader } from '../../../components/common/PageHeader';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { EmptyState } from '../../../components/common/EmptyState';
import { OrgTreeNode, employeesApi } from '../api/employeesApi';

interface TreeNodeProps {
  node: OrgTreeNode;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <Box sx={{ ml: { xs: 1.5, sm: 3 }, my: 1 }}>
      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          borderRadius: 2,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 2,
          minWidth: 300,
          backgroundColor: '#FFFFFF',
          borderColor: '#E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        {hasChildren ? (
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
          </IconButton>
        ) : (
          <Box sx={{ width: 24 }} />
        )}

        <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.9rem' }}>
          {node.firstName?.charAt(0) || 'U'}
        </Avatar>

        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              {node.fullName || `${node.firstName} ${node.lastName}`}
            </Typography>
            <Chip label={node.level} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
          </Box>
          <Typography variant="caption" color="text.secondary" display="block">
            {node.designation} • {node.departmentId?.name || 'Department'}
          </Typography>
        </Box>
      </Paper>

      {hasChildren && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box
            sx={{
              borderLeft: '2px dashed #CBD5E1',
              ml: 2,
              pl: 1,
            }}
          >
            {node.children!.map((child) => (
              <TreeNode key={child._id} node={child} />
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
};

export const OrgTreePage: React.FC = () => {
  const [treeData, setTreeData] = useState<OrgTreeNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTree = async () => {
      try {
        setLoading(true);
        const data = await employeesApi.getOrgTree();
        setTreeData(data);
      } finally {
        setLoading(false);
      }
    };
    fetchTree();
  }, []);

  return (
    <Box>
      <PageHeader
        title="Organisation Hierarchy Chart"
        subtitle="Visual tree view of reporting relationships within your visibility scope."
      />

      <Card>
        <CardContent sx={{ p: 3 }}>
          {loading ? (
            <LoadingSpinner minHeight="300px" />
          ) : treeData.length === 0 ? (
            <EmptyState
              title="No hierarchy data available"
              description="Ensure employees have active reporting relationships configured."
            />
          ) : (
            <Box sx={{ overflowX: 'auto', py: 2 }}>
              {treeData.map((rootNode) => (
                <TreeNode key={rootNode._id} node={rootNode} />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
