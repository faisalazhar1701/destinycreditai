const { PrismaClient } = require('@prisma/client');

async function testUsersApi() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing Prisma connection...');
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        status: true,
        subscription_status: true,
        createdAt: true,
        lastLogin: true,
        _count: {
          select: { letters: true, followUps: true }
        }
      }
    });
    console.log('Users fetched successfully:', users.length);
    console.log('Sample user:', users[0]);
  } catch (error) {
    console.error('Error fetching users:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUsersApi();