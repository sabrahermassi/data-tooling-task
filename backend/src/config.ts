import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name}. Copy .env.example to .env and set it.`);
    process.exit(1);
  }
  return value;
}

export const SEC_USER_AGENT = required("SEC_USER_AGENT");
export const PORT = Number(process.env.PORT ?? 3000);
export const USE_FIXTURES = process.env.USE_FIXTURES === "true";
