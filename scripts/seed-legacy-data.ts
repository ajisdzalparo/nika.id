import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding legacy data...");

  // Find the user "ajisdzalparo" or create updated one
  // Check if any user exists
  const user = await prisma.user.findFirst();

  if (!user) {
    console.log("No user found. Please register a user first.");
    return;
  }

  console.log(`Using user: ${user.email} (${user.id})`);

  // Delete existing invitation if any
  await prisma.invitation.deleteMany({
    where: { userId: user.id },
  });

  // Create legacy invitation (old format)
  await prisma.invitation.create({
    data: {
      userId: user.id,
      data: {
        groom: { name: "Romeo" },
        bride: { name: "Juliet" },
        event: {
          date: new Date().toISOString(),
          venue: "Old Venue",
        },
        // Missing events array
        // Missing quote
        // Missing loveStory
      },
    },
  });

  console.log("✅ Legacy invitation created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
