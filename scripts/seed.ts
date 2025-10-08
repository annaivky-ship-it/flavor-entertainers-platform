/**
 * Database Seeding Script
 * Creates initial data for development and testing
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Create admin users
  console.log('Creating admin users...');
  const adminPassword = await bcrypt.hash('Admin123!', 12);

  const admin1 = await prisma.user.upsert({
    where: { email: 'admin@flavorentertainers.com' },
    update: {},
    create: {
      email: 'admin@flavorentertainers.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      firstName: 'Super',
      lastName: 'Admin',
    },
  });

  const admin2 = await prisma.user.upsert({
    where: { email: 'contact@lustandlace.com.au' },
    update: {},
    create: {
      email: 'contact@lustandlace.com.au',
      passwordHash: adminPassword,
      role: 'ADMIN',
      firstName: 'Contact',
      lastName: 'Admin',
    },
  });

  console.log(`✅ Created ${admin1.email}`);
  console.log(`✅ Created ${admin2.email}\n`);

  // Create services
  console.log('Creating services...');
  const services = [
    {
      name: 'Premium Massage',
      description: 'Professional relaxation massage service',
      category: 'MASSAGE' as const,
      basePrice: 150,
      duration: 60,
    },
    {
      name: 'Couples Massage',
      description: 'Romantic massage for two',
      category: 'MASSAGE' as const,
      basePrice: 280,
      duration: 90,
    },
    {
      name: 'Elite Companionship',
      description: 'Professional companion for events',
      category: 'COMPANIONSHIP' as const,
      basePrice: 200,
      duration: 120,
    },
    {
      name: 'Dinner Date',
      description: 'Elegant dinner companion',
      category: 'COMPANIONSHIP' as const,
      basePrice: 300,
      duration: 180,
    },
    {
      name: 'Entertainment Package',
      description: 'Full entertainment experience',
      category: 'ENTERTAINMENT' as const,
      basePrice: 400,
      duration: 120,
    },
    {
      name: 'Private Show',
      description: 'Exclusive private entertainment',
      category: 'ENTERTAINMENT' as const,
      basePrice: 350,
      duration: 90,
    },
    {
      name: 'Intimate Experience',
      description: 'Private intimate session',
      category: 'INTIMATE' as const,
      basePrice: 500,
      duration: 120,
    },
    {
      name: 'Bespoke Package',
      description: 'Custom tailored experience',
      category: 'BESPOKE' as const,
      basePrice: 800,
      duration: 240,
    },
    {
      name: 'VIP Experience',
      description: 'Premium all-inclusive package',
      category: 'BESPOKE' as const,
      basePrice: 1200,
      duration: 360,
    },
    {
      name: 'Overnight Package',
      description: 'Extended overnight experience',
      category: 'BESPOKE' as const,
      basePrice: 2000,
      duration: 720,
    },
  ];

  const createdServices = [];
  for (const service of services) {
    const created = await prisma.service.upsert({
      where: { name: service.name },
      update: {},
      create: service,
    });
    createdServices.push(created);
    console.log(`✅ Created service: ${created.name}`);
  }
  console.log();

  // Create performer users
  console.log('Creating performers...');
  const performerPassword = await bcrypt.hash('Performer123!', 12);

  const performers = [
    {
      email: 'luna@flavorentertainers.com',
      firstName: 'Luna',
      stageName: 'Luna Star',
      bio: 'Professional entertainer with 5+ years experience. Specializing in premium massage and companionship services.',
      hourlyRate: 200,
    },
    {
      email: 'aria@flavorentertainers.com',
      firstName: 'Aria',
      stageName: 'Aria Rose',
      bio: 'Elegant and sophisticated companion. Perfect for high-class events and intimate gatherings.',
      hourlyRate: 250,
    },
    {
      email: 'jade@flavorentertainers.com',
      firstName: 'Jade',
      stageName: 'Jade Phoenix',
      bio: 'Exotic beauty offering bespoke entertainment experiences tailored to your desires.',
      hourlyRate: 300,
    },
    {
      email: 'ruby@flavorentertainers.com',
      firstName: 'Ruby',
      stageName: 'Ruby Diamond',
      bio: 'VIP companion specializing in premium experiences and exclusive events.',
      hourlyRate: 350,
    },
    {
      email: 'scarlett@flavorentertainers.com',
      firstName: 'Scarlett',
      stageName: 'Scarlett Flame',
      bio: 'Passionate performer offering unforgettable intimate experiences.',
      hourlyRate: 280,
    },
    {
      email: 'venus@flavorentertainers.com',
      firstName: 'Venus',
      stageName: 'Venus Divine',
      bio: 'Goddess-like beauty providing exceptional companionship and entertainment.',
      hourlyRate: 320,
    },
  ];

  for (const perf of performers) {
    const user = await prisma.user.upsert({
      where: { email: perf.email },
      update: {},
      create: {
        email: perf.email,
        passwordHash: performerPassword,
        role: 'PERFORMER',
        firstName: perf.firstName,
      },
    });

    const performer = await prisma.performer.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        stageName: perf.stageName,
        bio: perf.bio,
        hourlyRate: perf.hourlyRate,
        isVerified: true,
        isActive: true,
        availabilityStatus: 'AVAILABLE',
        rating: 4.5 + Math.random() * 0.5, // Random rating 4.5-5.0
      },
    });

    // Assign random services to performer
    const serviceCount = 3 + Math.floor(Math.random() * 3); // 3-5 services
    const assignedServices = createdServices
      .sort(() => Math.random() - 0.5)
      .slice(0, serviceCount);

    for (const service of assignedServices) {
      await prisma.performerService.upsert({
        where: {
          performerId_serviceId: {
            performerId: performer.id,
            serviceId: service.id,
          },
        },
        update: {},
        create: {
          performerId: performer.id,
          serviceId: service.id,
          customPrice: service.basePrice + Math.floor(Math.random() * 50), // Slight variation
          isOffered: true,
        },
      });
    }

    console.log(`✅ Created performer: ${performer.stageName}`);
  }
  console.log();

  // Create system settings
  console.log('Creating system settings...');
  const settings = [
    {
      key: 'deposit_percentage',
      value: '50',
      description: 'Percentage of total amount required as deposit',
    },
    {
      key: 'booking_advance_hours',
      value: '24',
      description: 'Minimum hours in advance for bookings',
    },
    {
      key: 'auto_cancel_hours',
      value: '24',
      description: 'Hours before auto-cancelling unpaid bookings',
    },
    {
      key: 'payid_enabled',
      value: 'true',
      description: 'Enable PayID payment method',
    },
    {
      key: 'whatsapp_enabled',
      value: 'true',
      description: 'Enable WhatsApp notifications',
    },
    {
      key: 'email_enabled',
      value: 'true',
      description: 'Enable email notifications',
    },
  ];

  for (const setting of settings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
    console.log(`✅ Created setting: ${setting.key}`);
  }
  console.log();

  console.log('✨ Database seeding completed!\n');
  console.log('📝 Test Credentials:');
  console.log('   Admin: admin@flavorentertainers.com / Admin123!');
  console.log('   Admin: contact@lustandlace.com.au / Admin123!');
  console.log('   Performer: luna@flavorentertainers.com / Performer123!');
  console.log('   (All performers use password: Performer123!)\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
