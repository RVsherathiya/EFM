import { Router } from 'express';
import multer from 'multer';
import { projectsController } from './projects.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRoles } from '../../middleware/role.middleware.js';
import { USER_ROLES } from '../../config/constants.js';
import { AppError } from '../../utils/app-error.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max (Section 22)
  },
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = ['.pdf', '.docx', '.xlsx', '.pptx', '.png', '.jpg', '.jpeg', '.txt', '.zip'];
    const originalName = file.originalname.toLowerCase();
    const isAllowed = allowedExtensions.some((ext) => originalName.endsWith(ext));

    if (!isAllowed) {
      return cb(
        AppError.badRequest(
          'File type not allowed (Section 22). Allowed types: PDF, DOCX, XLSX, PPTX, PNG, JPG, TXT, ZIP.'
        )
      );
    }
    cb(null, true);
  },
});

const router = Router();

router.use(authenticate);

// Project CRUD
router.get('/', (req, res, next) => projectsController.getProjects(req, res, next));
router.get('/:id', (req, res, next) => projectsController.getProjectById(req, res, next));
router.post(
  '/',
  requireRoles(USER_ROLES.PM, USER_ROLES.HR_ADMIN, USER_ROLES.SUPER_ADMIN),
  (req, res, next) => projectsController.createProject(req, res, next)
);
router.patch(
  '/:id',
  requireRoles(USER_ROLES.PM, USER_ROLES.HR_ADMIN, USER_ROLES.SUPER_ADMIN),
  (req, res, next) => projectsController.updateProject(req, res, next)
);

// Members
router.get('/:id/members', (req, res, next) => projectsController.getProjectMembers(req, res, next));
router.post(
  '/:id/members',
  requireRoles(USER_ROLES.PM, USER_ROLES.HR_ADMIN, USER_ROLES.SUPER_ADMIN),
  (req, res, next) => projectsController.addProjectMember(req, res, next)
);
router.delete(
  '/:id/members/:memberId',
  requireRoles(USER_ROLES.PM, USER_ROLES.HR_ADMIN, USER_ROLES.SUPER_ADMIN),
  (req, res, next) => projectsController.removeProjectMember(req, res, next)
);

// Documents
router.get('/:id/documents', (req, res, next) => projectsController.getProjectDocuments(req, res, next));
router.post(
  '/:id/documents',
  upload.single('file'),
  (req, res, next) => projectsController.uploadDocument(req, res, next)
);
router.get('/documents/:docId/download', (req, res, next) => projectsController.downloadDocument(req, res, next));

export default router;
