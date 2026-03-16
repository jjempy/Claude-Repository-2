import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// GET /analytics/summary
router.get('/summary', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organizationId;

    const [total, open, inProgress, resolved] = await Promise.all([
      prisma.problem.count({ where: { organizationId: orgId } }),
      prisma.problem.count({ where: { organizationId: orgId, actionStatus: 'OPEN' } }),
      prisma.problem.count({ where: { organizationId: orgId, actionStatus: 'IN_PROGRESS' } }),
      prisma.problem.count({ where: { organizationId: orgId, actionStatus: 'RESOLVED' } }),
    ]);

    // Average resolution time (in hours)
    const resolvedProblems = await prisma.problem.findMany({
      where: { organizationId: orgId, actionStatus: 'RESOLVED', resolutionDate: { not: null } },
      select: { createdAt: true, resolutionDate: true },
    });

    let avgResolutionHours = 0;
    if (resolvedProblems.length > 0) {
      const totalMs = resolvedProblems.reduce((sum, p) => {
        return sum + (p.resolutionDate!.getTime() - p.createdAt.getTime());
      }, 0);
      avgResolutionHours = Math.round(totalMs / resolvedProblems.length / 3600000);
    }

    res.json({ total, open, inProgress, resolved, avgResolutionHours });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// GET /analytics/root-cause-distribution
router.get('/root-cause-distribution', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organizationId;
    const problems = await prisma.problem.findMany({
      where: { organizationId: orgId, rootCauseCategory: { not: null } },
      select: { rootCauseCategory: true },
    });

    const distribution: Record<string, number> = {};
    problems.forEach((p) => {
      if (p.rootCauseCategory) {
        distribution[p.rootCauseCategory] = (distribution[p.rootCauseCategory] || 0) + 1;
      }
    });

    const data = Object.entries(distribution)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    res.json({ data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch distribution' });
  }
});

// GET /analytics/machine-issues
router.get('/machine-issues', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organizationId;
    const problems = await prisma.problem.findMany({
      where: { organizationId: orgId, machineId: { not: null } },
      select: { machineId: true, machine: { select: { name: true } } },
    });

    const distribution: Record<string, { name: string; count: number }> = {};
    problems.forEach((p) => {
      if (p.machineId && p.machine) {
        if (!distribution[p.machineId]) distribution[p.machineId] = { name: p.machine.name, count: 0 };
        distribution[p.machineId].count++;
      }
    });

    const data = Object.entries(distribution)
      .map(([id, { name, count }]) => ({ id, name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.json({ data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch machine issues' });
  }
});

// GET /analytics/trend (issues per week/month)
router.get('/trend', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organizationId;
    const { period = 'month' } = req.query;

    // Last 12 months or 12 weeks
    const now = new Date();
    const data = [];

    if (period === 'week') {
      for (let i = 11; i >= 0; i--) {
        const start = new Date(now);
        start.setDate(start.getDate() - i * 7);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        const count = await prisma.problem.count({
          where: { organizationId: orgId, createdAt: { gte: start, lt: end } },
        });
        data.push({ label: `W${12 - i}`, count });
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const count = await prisma.problem.count({
          where: { organizationId: orgId, createdAt: { gte: start, lt: end } },
        });
        const label = start.toLocaleString('default', { month: 'short' });
        data.push({ label, count });
      }
    }

    res.json({ data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch trend data' });
  }
});

export default router;
