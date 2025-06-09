import { PrismaClient } from "@prisma/client";

// Use singleton pattern for PrismaClient to prevent multiple instances during hot reloading
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
