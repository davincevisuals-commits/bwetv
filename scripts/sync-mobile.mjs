import { cp, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webDir = path.join(root, "www");
const includeExtensions = new Set([".html", ".js", ".css", ".mp4", ".webp"]);

await rm(webDir, { recursive: true, force: true });
await mkdir(webDir, { recursive: true });

for (const entry of await readdir(root, { withFileTypes: true })) {
  const source = path.join(root, entry.name);
  if (entry.isDirectory() && entry.name === "assets") {
    await cp(source, path.join(webDir, entry.name), { recursive: true });
  } else if (entry.isFile() && includeExtensions.has(path.extname(entry.name).toLowerCase())) {
    await cp(source, path.join(webDir, entry.name));
  }
}

console.log(`Copied website files into ${path.relative(root, webDir)}.`);
