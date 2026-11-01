import { createNeonAuth } from "@neon/auth/next/server";
import { authCookieSecret, env } from "@/lib/env";

export const auth = createNeonAuth({
  baseUrl: env.auth.baseUrl,
  cookies: { secret: authCookieSecret() },
});
