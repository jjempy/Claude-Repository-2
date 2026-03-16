import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create demo organization
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-factory' },
    update: {},
    create: {
      name: 'Demo Factory',
      slug: 'demo-factory',
    },
  });

  // Create facilities
  const facility1 = await prisma.facility.upsert({
    where: { id: 'facility-1' },
    update: {},
    create: {
      id: 'facility-1',
      name: 'Building A - Machining',
      organizationId: org.id,
    },
  });

  const facility2 = await prisma.facility.upsert({
    where: { id: 'facility-2' },
    update: {},
    create: {
      id: 'facility-2',
      name: 'Building B - Assembly',
      organizationId: org.id,
    },
  });

  // Create machines
  await prisma.machine.upsert({
    where: { id: 'machine-1' },
    update: {},
    create: {
      id: 'machine-1',
      name: 'CNC Mill #1',
      machineType: 'CNC Milling',
      facilityId: facility1.id,
      organizationId: org.id,
    },
  });

  await prisma.machine.upsert({
    where: { id: 'machine-2' },
    update: {},
    create: {
      id: 'machine-2',
      name: 'CNC Lathe #3',
      machineType: 'CNC Turning',
      facilityId: facility1.id,
      organizationId: org.id,
    },
  });

  await prisma.machine.upsert({
    where: { id: 'machine-3' },
    update: {},
    create: {
      id: 'machine-3',
      name: 'Assembly Station 7',
      machineType: 'Assembly',
      facilityId: facility2.id,
      organizationId: org.id,
    },
  });

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 10);

  await prisma.user.upsert({
    where: { email: 'manager@demo.com' },
    update: {},
    create: {
      email: 'manager@demo.com',
      password: hashedPassword,
      name: 'Sarah Manager',
      role: 'MANAGER',
      organizationId: org.id,
    },
  });

  const engineer = await prisma.user.upsert({
    where: { email: 'engineer@demo.com' },
    update: {},
    create: {
      email: 'engineer@demo.com',
      password: hashedPassword,
      name: 'John Engineer',
      role: 'ENGINEER',
      organizationId: org.id,
    },
  });

  const operator = await prisma.user.upsert({
    where: { email: 'operator@demo.com' },
    update: {},
    create: {
      email: 'operator@demo.com',
      password: hashedPassword,
      name: 'Mike Operator',
      role: 'OPERATOR',
      organizationId: org.id,
    },
  });

  console.log('Seed data created successfully');
  console.log('Demo users:');
  console.log('  manager@demo.com / password123');
  console.log('  engineer@demo.com / password123');
  console.log('  operator@demo.com / password123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
