import { prisma } from "../lib/prisma";

async function main() {
  try {
    console.log("Connecting to database...");
    const userCount = await prisma.user.count();
    console.log("Database connected successfully.");
    console.log("User count:", userCount);

    console.log("Attempting to create a test user...");
    const testUser = await prisma.user.create({
      data: {
        email: "dbcheck_" + Date.now() + "@example.com",
        name: "DB Check",
        role: "USER",
        invitationSlug: "dbcheck-" + Date.now(),
        emailVerified: false,
        updatedAt: new Date(),
      },
    });
    console.log("Test user created:", testUser.id);

    await prisma.user.delete({ where: { id: testUser.id } });
    console.log("Test user deleted.");
  } catch (error) {
    console.error("Database connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
