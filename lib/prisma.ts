import { PrismaPg } from "@prisma/adapter-pg";
import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaClient } from "@/app/generated/prisma/client";

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to initialize Prisma.");
  }

  if (databaseUrl.startsWith("prisma+postgres://")) {
    return new PrismaClient({ accelerateUrl: databaseUrl }).$extends(
      withAccelerate(),
    ) as unknown as PrismaClient;
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });

  return new PrismaClient({ adapter });
}

interface PrismaGlobal {
  prisma?: PrismaClient;
}

const globalForPrisma = globalThis as typeof globalThis & PrismaGlobal;
const requiredPrismaDelegates = [
  "project",
  "projectCollaborator",
  "projectSpec",
  "taskRun",
] as const;

function hasRequiredPrismaDelegates(client: PrismaClient) {
  const clientRecord = client as unknown as Record<string, unknown>;

  return requiredPrismaDelegates.every((delegate) => {
    return clientRecord[delegate] !== undefined;
  });
}

export const prisma: PrismaClient =
  globalForPrisma.prisma && hasRequiredPrismaDelegates(globalForPrisma.prisma)
    ? globalForPrisma.prisma
    : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
