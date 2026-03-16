import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// POST /auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, orgName, orgSlug } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    // Create or find organization
    let org;
    if (orgSlug) {
      org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
      if (!org) return res.status(400).json({ error: 'Organization not found' });
    } else {
      const slug = (orgSlug || orgName || name).toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
      org = await prisma.organization.create({
        data: { name: orgName || `${name}'s Organization`, slug },
      });
      // Create default facility and machine
      const facility = await prisma.facility.create({
        data: { name: 'Main Facility', organizationId: org.id },
      });
      await prisma.machine.create({
        data: { name: 'Machine 1', machineType: 'General', facilityId: facility.id, organizationId: org.id },
      });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, name, role: role || 'OPERATOR', organizationId: org.id },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, organizationId: user.organizationId },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, organizationId: user.organizationId } });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, organizationId: user.organizationId },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, organizationId: user.organizationId } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /auth/me
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, role: true, organizationId: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// GET /auth/users (list org users for assignment)
router.get('/users', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    const users = await prisma.user.findMany({
      where: { organizationId: decoded.organizationId },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });
    res.json({ users });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
