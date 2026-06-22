import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Seed for sampling and testing only
export async function seedCustomers(prisma: PrismaClient) {
  const hashedPassword = await bcrypt.hash('SecurePassword@123', 10);

  const customers = [
    {
      first_name: 'Ahmed',
      last_name: 'Yousry',
      email: 'ahmedyousry098@gmail.com',
      password: hashedPassword,
    },
    {
      first_name: 'Mohammed',
      last_name: 'Ali',
      email: 'mohammed.ali@gmail.com',
      password: hashedPassword,
    },
    {
      first_name: 'Zainab',
      last_name: 'Mohammed',
      email: 'zainab.mohammed@gmail.com',
      password: hashedPassword,
    },
  ];

  for (const customer of customers) {
    await prisma.customers.upsert({
      where: { email: customer.email },
      update: {},
      create: customer,
    });
  }
  console.log(`Seeded ${customers.length} customers.`);
}
