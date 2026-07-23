import { execSync } from "node:child_process";
import { roleHierarchy } from "../../src/data/hierarchy";

const KV_BINDING = "AUTH_KV";

function run(cmd: string): string {
  return execSync(cmd, { encoding: "utf-8", cwd: __dirname + "/.." });
}

const statuses: Record<string, any> = {};

roleHierarchy.forEach(level => {
  level.roles.forEach(role => {
    statuses[role.id] = {
      status: role.status,
      ...(role.status === "limited" ? { occupied: role.occupied, limit: role.limit } : {})
    };
  });
});

const value = JSON.stringify(statuses).replace(/'/g, "'\\''");
const cmd = `npx wrangler kv key put --binding=${KV_BINDING} --remote "hierarchy:statuses" '${value}'`;
console.log("Seeding statuses to KV...");
console.log(run(cmd));
console.log("✓ Done!");