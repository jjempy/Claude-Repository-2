import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

async function generateProblemId(orgId: string): Promise<string> {
  const count = await prisma.problem.count({ where: { organizationId: orgId } });
  return `RCA-${String(count + 1).padStart(4, '0')}`;
}

// GET /problems
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, machineId, search, dateFrom, dateTo, rootCauseCategory, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = { organizationId: req.user!.organizationId };
    if (status) where.actionStatus = status;
    if (machineId) where.machineId = machineId;
    if (rootCauseCategory) where.rootCauseCategory = rootCauseCategory;
    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) where.timestamp.gte = new Date(dateFrom as string);
      if (dateTo) where.timestamp.lte = new Date(dateTo as string);
    }
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { problemId: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [problems, total] = await Promise.all([
      prisma.problem.findMany({
        where,
        include: {
          machine: { include: { facility: true } },
          operator: { select: { id: true, name: true, email: true } },
          responsiblePerson: { select: { id: true, name: true, email: true } },
          attachments: true,
          actions: { include: { assignedTo: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.problem.count({ where }),
    ]);

    res.json({ problems, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
});

// GET /problems/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const problem = await prisma.problem.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
      include: {
        machine: { include: { facility: true } },
        facility: true,
        operator: { select: { id: true, name: true, email: true, role: true } },
        responsiblePerson: { select: { id: true, name: true, email: true, role: true } },
        attachments: true,
        actions: {
          include: { assignedTo: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });
    res.json({ problem });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch problem' });
  }
});

// POST /problems
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      title, description, severity, facilityId, machineId, materialBatch, toolType,
      processType, parameters, observedSymptoms, suspectedCauses, rootCause,
      rootCauseCategory, correctiveAction, responsiblePersonId, dueDate,
      estimatedCostImpact, actionStatus,
    } = req.body;

    if (!title) return res.status(400).json({ error: 'Title is required' });

    const problemId = await generateProblemId(req.user!.organizationId);

    const problem = await prisma.problem.create({
      data: {
        problemId,
        title,
        description,
        severity: severity || 'medium',
        facilityId,
        machineId,
        operatorId: req.user!.id,
        materialBatch,
        toolType,
        processType,
        parameters,
        observedSymptoms: observedSymptoms || [],
        suspectedCauses: suspectedCauses || [],
        rootCause,
        rootCauseCategory,
        correctiveAction,
        responsiblePersonId,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        estimatedCostImpact: estimatedCostImpact ? parseFloat(estimatedCostImpact) : undefined,
        actionStatus: actionStatus || 'OPEN',
        organizationId: req.user!.organizationId,
      },
      include: {
        machine: { include: { facility: true } },
        operator: { select: { id: true, name: true, email: true } },
        responsiblePerson: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json({ problem });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create problem' });
  }
});

// PUT /problems/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.problem.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
    });
    if (!existing) return res.status(404).json({ error: 'Problem not found' });

    const {
      title, description, severity, facilityId, machineId, materialBatch, toolType,
      processType, parameters, observedSymptoms, suspectedCauses, rootCause,
      rootCauseCategory, correctiveAction, responsiblePersonId, dueDate,
      estimatedCostImpact, actionStatus, outcome, resolutionDate,
    } = req.body;

    const update: any = {};
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (severity !== undefined) update.severity = severity;
    if (facilityId !== undefined) update.facilityId = facilityId;
    if (machineId !== undefined) update.machineId = machineId;
    if (materialBatch !== undefined) update.materialBatch = materialBatch;
    if (toolType !== undefined) update.toolType = toolType;
    if (processType !== undefined) update.processType = processType;
    if (parameters !== undefined) update.parameters = parameters;
    if (observedSymptoms !== undefined) update.observedSymptoms = observedSymptoms;
    if (suspectedCauses !== undefined) update.suspectedCauses = suspectedCauses;
    if (rootCause !== undefined) update.rootCause = rootCause;
    if (rootCauseCategory !== undefined) update.rootCauseCategory = rootCauseCategory;
    if (correctiveAction !== undefined) update.correctiveAction = correctiveAction;
    if (responsiblePersonId !== undefined) update.responsiblePersonId = responsiblePersonId;
    if (dueDate !== undefined) update.dueDate = dueDate ? new Date(dueDate) : null;
    if (estimatedCostImpact !== undefined) update.estimatedCostImpact = estimatedCostImpact ? parseFloat(estimatedCostImpact) : null;
    if (actionStatus !== undefined) {
      update.actionStatus = actionStatus;
      if (actionStatus === 'RESOLVED' && !existing.resolutionDate) {
        update.resolutionDate = new Date();
      }
    }
    if (outcome !== undefined) update.outcome = outcome;
    if (resolutionDate !== undefined) update.resolutionDate = resolutionDate ? new Date(resolutionDate) : null;

    const problem = await prisma.problem.update({
      where: { id: req.params.id },
      data: update,
      include: {
        machine: { include: { facility: true } },
        facility: true,
        operator: { select: { id: true, name: true, email: true, role: true } },
        responsiblePerson: { select: { id: true, name: true, email: true, role: true } },
        attachments: true,
        actions: { include: { assignedTo: { select: { id: true, name: true } } } },
      },
    });

    res.json({ problem });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update problem' });
  }
});

// DELETE /problems/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.problem.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
    });
    if (!existing) return res.status(404).json({ error: 'Problem not found' });

    await prisma.attachment.deleteMany({ where: { problemId: req.params.id } });
    await prisma.action.deleteMany({ where: { problemId: req.params.id } });
    await prisma.problem.delete({ where: { id: req.params.id } });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete problem' });
  }
});

export default router;
