import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// GET /machines
router.get('/', async (req: AuthRequest, res: Response) => {
  const { facilityId } = req.query;
  const machines = await prisma.machine.findMany({
    where: {
      organizationId: req.user!.organizationId,
      ...(facilityId ? { facilityId: facilityId as string } : {}),
    },
    include: { facility: true },
    orderBy: { name: 'asc' },
  });
  res.json({ machines });
});

// POST /machines
router.post('/', async (req: AuthRequest, res: Response) => {
  const { name, machineType, facilityId } = req.body;
  if (!name || !facilityId) return res.status(400).json({ error: 'Name and facilityId required' });
  const machine = await prisma.machine.create({
    data: { name, machineType, facilityId, organizationId: req.user!.organizationId },
    include: { facility: true },
  });
  res.json({ machine });
});

// DELETE /machines/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const machine = await prisma.machine.findFirst({
    where: { id: req.params.id, organizationId: req.user!.organizationId },
  });
  if (!machine) return res.status(404).json({ error: 'Not found' });
  await prisma.machine.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;
