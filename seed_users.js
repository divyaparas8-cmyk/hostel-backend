const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const usersToSeed = [
    {
      name: 'Test Owner',
      email: 'owner@gmail.com',
      phone: '1111111111',
      password: '123456',
      role: 'OWNER',
    },
    {
      name: 'Test Student',
      email: 'student@gmail.com',
      phone: '2222222222',
      password: '123456',
      role: 'STUDENT',
    }
  ];

  for (const user of usersToSeed) {
    const existingUser = await prisma.user.findUnique({ where: { email: user.email } });

    if (existingUser) {
      console.log(`User ${user.email} already exists!`);
      continue;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user.password, salt);

    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        password: hashedPassword,
        role: user.role,
      },
    });

    console.log(`User ${user.email} seeded successfully!`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
