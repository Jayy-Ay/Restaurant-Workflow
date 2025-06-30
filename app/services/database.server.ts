import { PrismaClient } from "@prisma/client";

declare global {
  var __prisma: PrismaClient;
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Please create a `.env` file in the root of your project if it does not already exist, " +
      "and add the following line to it: DATABASE_URL=your-database-url-here"
  );
}

if (!global.__prisma) {
  global.__prisma = new PrismaClient();
}

global.__prisma.$connect();
export const prisma = global.__prisma;
