import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";

async function main() {
  const hashedPassword = await bcrypt.hash("dyd4x949pa", 10);

  const admin = await prisma.user.create({
    data: {
      name: "User",
      email: "user@safaro.com",
      password: hashedPassword,
      role: "USER",
      companyId: "company-1",   // any string is valid in your schema
      approverId: null
    }
  });

  console.log("User created:", admin);
}

main()
  .catch(err => console.error(err))
  .finally(async () => prisma.$disconnect());
