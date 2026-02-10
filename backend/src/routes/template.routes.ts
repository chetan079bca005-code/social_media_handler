import { Router } from 'express';
import { z } from 'zod';
import * as templateController from '../controllers/template.controller';
import { validateBody } from '../middleware/validate';
import { authenticate, requireWorkspace } from '../middleware/auth';

const router = Router();

router.use(authenticate);

const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  content: z.string().min(1),
  category: z.string().max(100).optional(),
  platforms: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  content: z.string().min(1).optional(),
  category: z.string().max(100).optional(),
  platforms: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

router.get('/', requireWorkspace(), templateController.getTemplates);
router.get('/categories', requireWorkspace(), templateController.getCategories);
router.get('/:id', templateController.getTemplate);
router.post('/', requireWorkspace(['OWNER', 'ADMIN', 'EDITOR']), validateBody(createTemplateSchema), templateController.createTemplate);
router.put('/:id', requireWorkspace(['OWNER', 'ADMIN', 'EDITOR']), validateBody(updateTemplateSchema), templateController.updateTemplate);
router.delete('/:id', requireWorkspace(['OWNER', 'ADMIN']), templateController.deleteTemplate);
router.post('/:id/use', templateController.useTemplate);

export default router;
