import { readdir, readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const ignoredDirectories = new Set([".git", "node_modules", ".temp"]);
const findings = [];
const serviceRoleValues = [
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  process.env.SERVICE_ROLE_KEY,
].filter((value) => typeof value === "string" && value.length > 0);

async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await scan(path);
      continue;
    }

    const content = await readFile(path);
    if (content.includes(0)) continue;
    const text = content.toString("utf8");
    const name = relative(root, path);

    if (/sb[_]secret[_][A-Za-z0-9_-]+/i.test(text)) {
      findings.push(`${name}: Stripe/Supabase secret-key prefix found`);
    }
    if (
      /^\s*(?:export\s+)?(?:SUPABASE_)?SERVICE_ROLE_KEY\s*=\s*\S+/im.test(text)
    ) {
      findings.push(`${name}: service-role key assignment found`);
    }
    if (
      /^\s*(?:export\s+)?VITE_[A-Z0-9_]*(?:SECRET|SERVICE_ROLE|PRIVATE|TOKEN|API_KEY)[A-Z0-9_]*\s*=\s*\S+/im.test(
        text,
      )
    ) {
      findings.push(`${name}: VITE_ secret-like variable assignment found`);
    }

    for (const value of serviceRoleValues) {
      if (text.includes(value)) {
        findings.push(`${name}: configured service-role value found`);
      }
    }

    for (const token of text.matchAll(
      /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
    )) {
      try {
        const claims = JSON.parse(
          Buffer.from(token[0].split(".")[1], "base64url").toString("utf8"),
        );
        if (
          claims.role === "service_role" ||
          claims.role === "supabase_admin"
        ) {
          findings.push(`${name}: privileged JWT found`);
          break;
        }
      } catch {
        // A JWT-shaped string that does not decode as a claims object is not a credential.
      }
    }
  }
}

await scan(root);

if (findings.length > 0) {
  console.error("Secret hygiene check failed:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exitCode = 1;
} else {
  console.log("Secret hygiene check passed (including dist/ when present).");
}
