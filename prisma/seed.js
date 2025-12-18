const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create default workflows
  const workflows = [
    {
      name: 'Credit Dispute Process',
      steps: {
        steps: [
          'Obtain your free annual credit reports from all three bureaus',
          'Review reports for potentially inaccurate items',
          'Generate dispute letter using AI tool',
          'Submit via certified mail and track timeline'
        ]
      },
      enabled: true
    },
    {
      name: 'Follow-Up Letter Process',
      steps: {
        steps: [
          'Check if 30+ days have passed since initial dispute',
          'Generate follow-up correspondence using AI',
          'Document all progress and responses'
        ]
      },
      enabled: true
    },
    {
      name: 'Metro 2 Education',
      steps: {
        steps: [
          'Understand Metro 2 format basics',
          'Learn about data field requirements',
          'Identify potential compliance issues'
        ]
      },
      enabled: true
    },
    {
      name: 'AI Chat Guidance',
      steps: {
        steps: [
          'Ask educational credit questions',
          'Review AI responses for information',
          'Use guidance to make informed decisions'
        ]
      },
      enabled: true
    },
    {
      name: 'Credit Education Resources',
      steps: {
        steps: [
          'Learn credit basics and scoring factors',
          'Understand dispute process and rights',
          'Apply best practices for credit maintenance'
        ]
      },
      enabled: true
    }
  ];

  for (const workflow of workflows) {
    const existing = await prisma.workflow.findFirst({ where: { name: workflow.name } });
    if (!existing) {
      await prisma.workflow.create({ data: workflow });
    }
  }

  // Create default AI prompts
  const aiPrompts = [
    {
      type: 'system',
      content: 'You are an AI assistant that helps create educational credit dispute letters. Always use conditional language and never guarantee outcomes.',
      enabled: true
    },
    {
      type: 'dispute',
      content: 'Create a professional dispute letter that uses conditional language like "if inaccurate" and "may be inconsistent".',
      enabled: true
    },
    {
      type: 'validation',
      content: 'Create a validation letter requesting verification of account details and reporting accuracy.',
      enabled: true
    },
    {
      type: 'goodwill',
      content: 'Create a goodwill letter requesting consideration for removal of accurate but negative information.',
      enabled: true
    }
  ];

  for (const prompt of aiPrompts) {
    const existing = await prisma.aIPrompt.findFirst({ where: { type: prompt.type } });
    if (!existing) {
      await prisma.aIPrompt.create({ data: prompt });
    }
  }

  // Create default disclaimers
  const disclaimers = [
    {
      type: 'letters',
      content: 'This letter is for educational purposes only and does not constitute legal advice. No guaranteed outcomes are implied. User must verify all information before use.',
      enabled: true
    },
    {
      type: 'onboarding',
      content: 'This platform provides educational information only. All tools and content are for learning purposes. Consult qualified professionals for legal matters.',
      enabled: true
    }
  ];

  for (const disclaimer of disclaimers) {
    const existing = await prisma.disclaimer.findFirst({ where: { type: disclaimer.type } });
    if (!existing) {
      await prisma.disclaimer.create({ data: disclaimer });
    }
  }

  // Create Resources
  const resources = [
    { title: 'Join Our Community', url: 'https://www.skool.com/shakehandswithdestiny/about', type: 'COMMUNITY', description: 'Join our Skool community for support', visible: true },
    { title: 'How to remove collection in 24–72 hours', url: 'https://youtu.be/0DYVSIBWfvU', type: 'VIDEO', description: 'Video guide for collection removal', visible: true },
    { title: 'Cash for Delete', url: 'https://youtu.be/1OarOSL5nAQ', type: 'VIDEO', description: 'Understanding Pay for Delete', visible: true },
    { title: 'Late Payment Dispute', url: 'https://www.loom.com/share/45a4fc64d8f549e0b54e96619191f164', type: 'VIDEO', description: 'Guide for disputing late payments', visible: true },
    { title: 'CFPB Complaint for Late Payments', url: 'https://www.loom.com/share/e99f7b9bd55649d9839112dcace2c764', type: 'VIDEO', description: 'Filing a CFPB complaint for late payments', visible: true },
    { title: 'CFPB Complaint for Charge-Off', url: 'https://youtu.be/2N-XQwp95ak', type: 'VIDEO', description: 'Filing a CFPB complaint for charge-offs', visible: true },
    { title: 'Remove Charge-Offs with 1099-C', url: 'https://youtu.be/qfjVsOIF9SQ', type: 'VIDEO', description: 'Strategy for 1099C charge-off removal', visible: true },
    { title: 'Bankruptcy Masterclass', url: 'https://youtu.be/rwoZw-PNH2s', type: 'VIDEO', description: 'Educational masterclass on bankruptcy', visible: true },
    { title: 'CFPB Complaint for Bankruptcy', url: 'https://youtu.be/TzphCW5lOaY', type: 'VIDEO', description: 'Filing a complaint regarding bankruptcy', visible: true },
    { title: 'MyScoreIQ', url: 'https://member.myscoreiq.com/get-fico-preferred.aspx?offercode=432130N3&kuid=cd46f59d-e9e8-4020-bcb2-8f6068647ec1&kref=https%3A%2F%2Fwww.shakehandswithdestiny.org%2Fdigital-course%2Fsubcategory%2F16', type: 'EXTERNAL', description: 'Credit monitoring service', visible: true },
    { title: 'Better Business Bureau (BBB)', url: 'https://www.bbb.org', type: 'EXTERNAL', description: 'File a complaint with the BBB', visible: true }
  ];

  for (const resource of resources) {
    const existing = await prisma.resourceLink.findFirst({ where: { title: resource.title } });
    if (!existing) {
      await prisma.resourceLink.create({ data: resource });
    } else {
      // Update URL if it changed
      await prisma.resourceLink.update({
        where: { id: existing.id },
        data: { url: resource.url }
      });
    }
  }

  // Create or Update default user
  const existingUser = await prisma.user.findUnique({ where: { email: 'admin@destinycredit.com' } });
  const hashedPassword = await bcrypt.hash('password123', 10);

  if (!existingUser) {
    await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@destinycredit.com',
        role: 'ADMIN',
        active: true,
        password: hashedPassword
      }
    });
    console.log('Created admin user: admin@destinycredit.com / password123');
  } else {
    // Update password for existing user to ensure it works
    await prisma.user.update({
      where: { email: 'admin@destinycredit.com' },
      data: { password: hashedPassword, role: 'ADMIN' }
    });
    console.log('Updated admin user password to: password123');
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });