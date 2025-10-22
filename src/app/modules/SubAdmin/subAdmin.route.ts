import express from 'express';
import { SubadminController } from './subAdmin.controller';

const router = express.Router();

router.post('/', SubadminController.createSubadmin);
router.get('/', SubadminController.getAllSubadmins);
router.get('/:id', SubadminController.getSingleSubadmin);
router.patch('/:id', SubadminController.updateSubadmin);
router.delete('/:id', SubadminController.deleteSubadmin);

export const SubadminRoutes = router;
