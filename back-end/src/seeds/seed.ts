import { seedTemplates } from "./seedTemplates";
import { PrismaClient } from "@prisma/client";
import { seedProducts } from "./seedProducts";
import { seedClients } from "./seedClients";
import { seedClientPayments } from "./seedClientPayments";
import { seedPixKeys } from "./seedPixKeys";
import { seedGroups } from "./seedGroups";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function clearUserData(userId: string) {
  // Remove entidades dependentes respeitando relações
  await prisma.client.deleteMany({ where: { user_id: userId } });
  await prisma.product.deleteMany({ where: { user_id: userId } });
  await prisma.template.deleteMany({ where: { user_id: userId } });
  await prisma.pixKey.deleteMany({ where: { user_id: userId } });
}

async function main() {
  // Garante grupos básicos
  await seedGroups(prisma);

  // Cria/garante um usuário ADMIN
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@agendapix.local";
  const adminName = process.env.SEED_ADMIN_NAME || "Admin";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "admin123";

  const adminGroup = await prisma.group.findUnique({ where: { name: "ADMIN" } });
  if (!adminGroup) {
    throw new Error("Grupo ADMIN não encontrado. Verifique o seedGroups.");
  }

  const passwordHash = bcrypt.hashSync(adminPassword);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: adminName, groupId: adminGroup.id },
    create: { name: adminName, email: adminEmail, password: passwordHash, groupId: adminGroup.id },
  });

  // Garante que os grupos existam
  await seedGroups(prisma);

  // Limpa dados anteriores do ADMIN para re-seed controlado
  await clearUserData(adminUser.id);

  // Primeiro cria entidades dependências
  await seedProducts(prisma, adminUser.id, 40);
  await seedPixKeys(prisma, adminUser.id, 12);
  await seedTemplates(prisma, adminUser.id, 20);
  // Depois cria clientes referenciando as anteriores
  await seedClients(prisma, adminUser.id, 50);
  await seedClientPayments(prisma, adminUser.id, { maxPerClient: 3 });

  console.log("✅ Seed principal concluído (clientes + produtos + pix keys + templates + charges)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
