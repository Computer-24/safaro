import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";

async function main() {
  const companyName = "Safaro HQ";

  // 1. Ensure company exists
  let company = await prisma.company.findFirst({
    where: { name: companyName }
  });

  if (!company) {
    company = await prisma.company.create({
      data: { name: companyName }
    });
    console.log("Company created:", company);
  } else {
    console.log("Company already exists:", company);
  }

  // 2. Hash password once
  const hashedPassword = await bcrypt.hash("dyd4x949pa", 10);

  // 3. Create or fetch the approver
  const approverEmail = "antony@safaro.com";

  let approver = await prisma.user.findUnique({
    where: { email: approverEmail }
  });

  if (!approver) {
    approver = await prisma.user.create({
      data: {
        name: "Antony Smith",
        email: approverEmail,
        password: hashedPassword,
        role: "APPROVER",
        companyId: company.id,
        approverId: null
      }
    });
    console.log("Approver created:", approver);
  } else {
    console.log("Approver already exists:", approver);
  }

  // 4. Create 20 users assigned to this approver
  for (let i = 1; i <= 20; i++) {
    const email = `user${i}@safaro.com`;

    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      console.log(`User ${email} already exists, skipping.`);
      continue;
    }

    const user = await prisma.user.create({
      data: {
        name: `User ${i}`,
        email,
        password: hashedPassword,
        role: "USER",
        companyId: company.id,
        approverId: approver.id
      }
    });

    console.log(`Created user ${i}:`, user.email);
  }
}

main()
  .catch(err => console.error(err))
  .finally(async () => prisma.$disconnect());
