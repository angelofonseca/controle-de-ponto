import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

export function createPrismaClientOptions(): ConstructorParameters<
  typeof PrismaClient
>[0] {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  return {
    adapter: new PrismaPg({ connectionString }),
  };
}
