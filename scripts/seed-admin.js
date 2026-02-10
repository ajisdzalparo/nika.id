// Simple seeding script to ensure there is one SUPER ADMIN and one USER in the database.
// Jalankan dengan:
//   node scripts/seed-admin.js
//
// Catatan penting:
// - Jika user dengan email yang sama sudah ada, script HANYA akan mengubah field `role`-nya.
// - Jika belum ada, script akan membuat record di tabel `User`, tetapi TANPA password.
//   Supaya bisa login dengan email/password, sebaiknya:
//   1) Daftar dulu lewat halaman /register dengan email yang sama
//   2) Lalu jalankan script ini untuk mengubah role-nya menjadi ADMIN / USER.

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const superAdminEmail = "superadmin@nika.id";
  const userEmail = "user@nika.id";

  console.log("Seeding SUPER ADMIN dan USER demo...\n");

  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {
      role: "ADMIN",
    },
    create: {
      email: superAdminEmail,
      name: "Super Admin",
      role: "ADMIN",
      invitationSlug: "superadmin-seed",
      emailVerified: true,
    },
  });

  const normalUser = await prisma.user.upsert({
    where: { email: userEmail },
    update: {
      role: "USER",
    },
    create: {
      email: userEmail,
      name: "Demo User",
      role: "USER",
      invitationSlug: "user-seed",
      emailVerified: true,
    },
  });

  console.log("Super Admin:");
  console.log(`  email: ${superAdmin.email}`);
  console.log(`  role : ${superAdmin.role}`);
  console.log();

  console.log("User biasa:");
  console.log(`  email: ${normalUser.email}`);
  console.log(`  role : ${normalUser.role}`);
}

main()
  .catch((err) => {
    console.error("Gagal menjalankan seed-admin:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

