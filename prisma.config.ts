import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "src/core/infrastructure/prisma/schema.prisma",
});