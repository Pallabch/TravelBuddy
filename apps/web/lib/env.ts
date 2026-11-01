import { parseEnv } from "@neon/env";
import config from "../../../neon";

export const env = parseEnv(config, [
  "DATABASE_URL",
  "NEON_AUTH_BASE_URL",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_ENDPOINT_URL_S3",
  "AWS_REGION",
]);

export function authCookieSecret() {
  const secret = process.env.NEON_AUTH_COOKIE_SECRET;
  if (!secret) {
    throw new Error(
      "NEON_AUTH_COOKIE_SECRET is missing. Add a 32+ character secret to .env.local.",
    );
  }
  return secret;
}
