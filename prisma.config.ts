import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

config({ path: ".env.local" });
config();

function prismaCliDatabaseUrl() {
  const directUrl = process.env.DIRECT_URL?.trim();

  if (directUrl) {
    const parsedDirectUrl = new URL(directUrl);

    if (
      parsedDirectUrl.hostname.includes("supabase.com") &&
      !parsedDirectUrl.searchParams.has("sslmode")
    ) {
      parsedDirectUrl.searchParams.set("sslmode", "require");
      parsedDirectUrl.searchParams.set("sslaccept", "accept_invalid_certs");
    }

    return parsedDirectUrl.toString();
  }

  const url = env("DATABASE_URL");

  if (!url.includes("pooler.supabase.com:6543")) {
    return url;
  }

  const parsed = new URL(url);
  parsed.port = "5432";
  parsed.searchParams.delete("pgbouncer");
  parsed.searchParams.set("sslmode", "require");
  parsed.searchParams.set("sslaccept", "accept_invalid_certs");

  return parsed.toString();
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: prismaCliDatabaseUrl(),
  },
});
