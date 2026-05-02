// scripts/seed-companies.js
import "dotenv/config";
import { prisma } from "../lib/prisma.js";

/**
 * Simple seeding script to create 30 companies.
 * - Idempotent: will skip companies that already exist by name.
 * - Sets isActive: true by default.
 *
 * Run: node ./scripts/seed-companies.js
 */

const COMPANY_COUNT = 30;

function makeCompanyName(i) {
  // You can replace this with a list of real names or a faker-based generator.
  return `Acme Corp ${String(i).padStart(2, "0")}`;
}

async function main() {
  console.log(`Seeding ${COMPANY_COUNT} companies...`);

  for (let i = 1; i <= COMPANY_COUNT; i++) {
    const name = makeCompanyName(i);

    try {
      const existing = await prisma.company.findFirst({
        where: { name },
      });

      if (existing) {
        console.log(`Skipping (exists): ${name}`);
        continue;
      }

      const created = await prisma.company.create({
        data: {
          name,
          isActive: true,
        },
      });

      console.log(`Created: ${created.id} — ${created.name}`);
    } catch (err) {
      console.error(`Error creating company "${name}":`, err);
    }
  }

  console.log("Seeding complete.");
}

main()
  .catch((err) => {
    console.error("Seeding failed:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
