import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// GET /actions
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, problemId } = req.query;
    const where: any = {};
    if (problemId) {
      where.problemId = problemId;
    } else {
      // Only return actions for problems in user's org
      where.problem = { organizationId: req.user!.organizationId };
    }
    if (status) where.status = status;

    const actions = await prisma.action.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        problem: { select: { id: true, problemId: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ actions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch actions' });
  }
});

// POST /actions
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { description, assignedToId, dueDate, problemId, notes } = req.body;
    if (!description || !assignedToId || !problemId) {
      return res.status(400).json({ error: 'description, assignedToId, and problemId are required' });
    }

    const problem = await prisma.problem.findFirst({
      where: { id: problemId, organizationId: req.user!.organizationId },
    });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    const action = await prisma.action.create({
      data: {
        description,
        assignedToId,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        problemId,
        notes,
        status: 'OPEN',
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        problem: { select: { id: true, problemId: true, title: true } },
      },
    });

    res.status(201).json({ action });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create action' });
  }
});

// PUT /actions/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.action.findFirst({
      where: { id: req.params.id, problem: { organizationId: req.user!.organizationId } },
    });
    if (!existing) return res.status(404).json({ error: 'Action not found' });

    const { description, assignedToId, dueDate, status, notes } = req.body;
    const update: any = {};
    if (description !== undefined) update.description = description;
    if (assignedToId !== undefined) update.assignedToId = assignedToId;
    if (dueDate !== undefined) update.dueDate = dueDate ? new Date(dueDate) : null;
    if (notes !== undefined) update.notes = notes;
    if (status !== undefined) {
      update.status = status;
      if (status === 'RESOLVED') update.completedAt = new Date();
    }

    const action = await prisma.action.update({
      where: { id: req.params.id },
      data: update,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        problem: { select: { id: true, problemId: true, title: true } },
      },
    });

    res.json({ action });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update action' });
  }
});

// DELETE /actions/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.action.findFirst({
      where: { id: req.params.id, problem: { organizationId: req.user!.organizationId } },
    });
    if (!existing) return res.status(404).json({ error: 'Action not found' });
    await prisma.action.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete action' });
  }
});

export default router;
