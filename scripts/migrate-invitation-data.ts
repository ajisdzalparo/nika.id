import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_QUOTE = {
  text: "Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang. Sungguh, pada yang demikian itu benar-benar terdapat tanda-tanda (kebesaran Allah) bagi kaum yang berpikir.",
  source: "Qs. Ar-Rum: 21",
};

async function main() {
  console.log("🚀 Starting migration...");

  const invitations = await prisma.invitation.findMany();
  console.log(`Found ${invitations.length} invitations to check.`);

  let updatedCount = 0;

  for (const inv of invitations) {
    const data = inv.data as any;
    let needsUpdate = false;

    // 1. Migrate single event -> events array
    if (!data.events && data.event) {
      console.log(`Migrating event for user ${inv.userId}...`);
      data.events = [
        {
          id: "1",
          title: "Akad Nikah",
          ...data.event,
        },
        {
          id: "2",
          title: "Resepsi",
          ...data.event, // Copy same details initially
          time: "11:00 - 13:00", // Default diff time
        },
      ];
      needsUpdate = true;
    }

    // 2. Add Quote
    if (!data.quote) {
      console.log(`Adding default quote for user ${inv.userId}...`);
      data.quote = DEFAULT_QUOTE;
      needsUpdate = true;
    }

    // 3. Add Love Story (disabled by default)
    if (!data.loveStory) {
      console.log(`Adding loveStory config for user ${inv.userId}...`);
      data.loveStory = {
        enabled: false,
        chapters: [],
      };
      needsUpdate = true;
    }

    if (needsUpdate) {
      await prisma.invitation.update({
        where: { id: inv.id },
        data: { data },
      });
      updatedCount++;
    }
  }

  console.log(`✅ Migration complete. Updated ${updatedCount} invitations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
