// Use real Prisma client for both development and production
// Only use CSV mock if explicitly requested
if (process.env.USE_CSV_MOCK === "true") {
  const { csvMockPrisma } = require("./csvMockPrisma")
  module.exports = { prisma: csvMockPrisma }
} else {
  const { PrismaClient } = require("@prisma/client")
  const globalForPrisma = globalThis
  const prisma = globalForPrisma.__prisma || new PrismaClient()
  if (process.env.NODE_ENV !== "production") globalForPrisma.__prisma = prisma
  module.exports = { prisma }
}
