// Use CSV-based mock data in development to bypass database setup
if (process.env.NODE_ENV === "development") {
  const { csvMockPrisma } = require("./csvMockPrisma")
  module.exports = { prisma: csvMockPrisma }
} else {
  const { PrismaClient } = require("@prisma/client")
  const globalForPrisma = globalThis
  const prisma = globalForPrisma.__prisma || new PrismaClient()
  if (process.env.NODE_ENV !== "production") globalForPrisma.__prisma = prisma
  module.exports = { prisma }
}
