import { existsSync, symlinkSync } from "node:fs";
import path from "node:path";

const link = path.resolve("apps/web/.env.local");
if (!existsSync(link)) {
  symlinkSync("../../.env.local", link);
}
