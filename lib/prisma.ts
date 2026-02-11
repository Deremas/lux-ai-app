import { PrismaClient } from "@prisma/client";

type PrismaGlobal = {
  prisma?: PrismaClient;
};

const globalRef = globalThis as unknown as PrismaGlobal;

export const prisma = globalRef.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalRef.prisma = prisma;
}
