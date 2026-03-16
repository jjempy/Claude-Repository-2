import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// GET /facilities
router.get('/', async (req: AuthRequest, res: Response) => {
  const facilities = await prisma.facility.findMany({
    where: { organizationId: req.user!.organizationId },
    include: { machines: { orderBy: { name: 'asc' } } },
    orderBy: { name: 'asc' },
  });
  res.json({ facilities });
});

// POST /facilities
router.post('/', async (req: AuthRequest, res: Response) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const facility = await prisma.facility.create({
    data: { name, organizationId: req.user!.organizationId },
  });
  res.json({ facility });
});

export default router;
