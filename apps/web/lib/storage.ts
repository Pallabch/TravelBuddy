import { Files } from "files-sdk";
import { neon } from "files-sdk/neon";
import { env } from "@/lib/env";

// Reading the parsed env makes a missing credential fail here, with a clear
// error, before the S3 client sends a request. The adapter itself reads the
// same AWS_* variables from the environment.
void env.storage;

export const files = new Files({
  adapter: neon({ bucket: "assets" }),
});
