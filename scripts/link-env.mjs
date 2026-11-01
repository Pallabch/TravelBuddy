import { existsSync, symlinkSync } from "node:fs";
import path from "node:path";

const target = path.resolve(".env.local");
const link = path.resolve("apps/web/.env.local");
if (existsSync(target) && !existsSync(link)) {
  symlinkSync("../../.env.local", link);
}
