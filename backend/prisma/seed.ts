import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean up existing data
  await prisma.timeRecord.deleteMany();
  await prisma.attendanceDay.deleteMany();
  await prisma.qrCodeSession.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.employeeProfile.deleteMany();
  await prisma.workSchedule.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  // Create demo company
  const company = await prisma.company.create({
    data: {
      name: 'Empresa Demo Ltda',
      cnpj: '00.000.000/0001-00',
      email: 'contato@empresademo.com',
      phone: '(11) 9999-9999',
      address: 'Rua Demo, 123 - São Paulo, SP',
    },
  });
  console.log(`✅ Company created: ${company.name}`);

  // Create work schedule
  const workSchedule = await prisma.workSchedule.create({
    data: {
      name: 'Horário Padrão',
      startTime: '08:00',
      endTime: '17:00',
      breakDuration: 60,
      workingDays: [1, 2, 3, 4, 5], // Monday to Friday
      toleranceMinutes: 10,
      companyId: company.id,
    },
  });
  console.log(`✅ Work schedule created: ${workSchedule.name}`);

  // Hash password
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@empresademo.com',
      password: hashedPassword,
      name: 'Administrador Demo',
      role: Role.COMPANY_ADMIN,
      companyId: company.id,
    },
  });
  console.log(`✅ Admin user created: ${admin.email}`);

  // Create employee users
  const employeePassword = await bcrypt.hash('Employee@123', 10);

  const employees = [
    { name: 'João Silva', email: 'joao.silva@empresademo.com', registration: 'EMP001', position: 'Desenvolvedor', department: 'TI' },
    { name: 'Maria Santos', email: 'maria.santos@empresademo.com', registration: 'EMP002', position: 'Designer', department: 'Marketing' },
    { name: 'Carlos Oliveira', email: 'carlos.oliveira@empresademo.com', registration: 'EMP003', position: 'Analista', department: 'Financeiro' },
  ];

  for (const emp of employees) {
    const user = await prisma.user.create({
      data: {
        email: emp.email,
        password: employeePassword,
        name: emp.name,
        role: Role.EMPLOYEE,
        companyId: company.id,
        employeeProfile: {
          create: {
            registration: emp.registration,
            position: emp.position,
            department: emp.department,
            hireDate: new Date('2024-01-01'),
            workScheduleId: workSchedule.id,
          },
        },
      },
    });
    console.log(`✅ Employee created: ${user.email}`);
  }

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Test credentials:');
  console.log('  Admin:    admin@empresademo.com / Admin@123');
  console.log('  Employee: joao.silva@empresademo.com / Employee@123');
  console.log('  Employee: maria.santos@empresademo.com / Employee@123');
  console.log('  Employee: carlos.oliveira@empresademo.com / Employee@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
