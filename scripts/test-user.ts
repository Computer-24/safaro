import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";

async function main() {
  const companyName = "Safaro HQ";

  // 1. Check if company already exists
  let company = await prisma.company.findFirst({
    where: { name: companyName }
  });

  // 2. Create company only if it doesn't exist
  if (!company) {
    company = await prisma.company.create({
      data: { name: companyName }
    });
    console.log("Company created:", company);
  } else {
    console.log("Company already exists:", company);
  }

  // 3. Hash password
  const hashedPassword = await bcrypt.hash("dyd4x949pa", 10);

  // 4. Check if user user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: "user@safaro.com" }
  });

  if (!existingUser) {
    const user = await prisma.user.create({
      data: {
        name: "user",
        email: "user@safaro.com",
        password: hashedPassword,
        role: "USER",
        companyId: company.id,
        approverId: null
      }
    });

    console.log("user user created:", user);
  } else {
    console.log("user user already exists:", existingUser);
  }
}

main()
  .catch(err => console.error(err))
  .finally(async () => prisma.$disconnect());
