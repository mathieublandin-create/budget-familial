// Test de livraison — le build dist/ doit être complet et cohérent (version injectée partout).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const VERSION = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).version;

test("livraison — dist/ complet : manifeste, service worker, icônes 192/512, version injectée", () => {
  for (const f of ["index.html", "app.js", "styles.css", "sw.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"]) {
    assert.ok(existsSync(join(DIST, f)), `manquant: ${f}`);
  }
  const sw = readFileSync(join(DIST, "sw.js"), "utf8");
  assert.ok(sw.includes(VERSION), "version injectée dans sw.js");
  assert.ok(!sw.includes("{{APP_VERSION}}"), "placeholder non injecté dans sw.js");
  const html = readFileSync(join(DIST, "index.html"), "utf8");
  assert.ok(html.includes(VERSION), "version injectée dans index.html");
  const fichiers = readdirSync(DIST, { recursive: true }).filter((f) => !f.includes("node_modules"));
  assert.ok(fichiers.length >= 10, `dist trop pauvre (${fichiers.length} fichiers)`);
});
