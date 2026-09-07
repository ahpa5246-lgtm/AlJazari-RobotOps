import { cp, mkdir, rm, writeFile } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await cp("public", "dist/public", { recursive: true });
await cp("src", "dist/src", { recursive: true });
await writeFile("dist/package.json", JSON.stringify({ type: "module", scripts: { start: "node src/server.js" } }, null, 2));
console.log("Built dist/ with server and static command center.");
