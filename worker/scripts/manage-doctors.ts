/**
 * Скрипт для управління списком допущеного персоналу в KV.
 *
 * Використання (після деплою Worker'а та створення KV):
 *
 *   npx tsx scripts/manage-doctors.ts add 123456789012345678 "Ковальська О.І." "Головний лікар"
 *   npx tsx scripts/manage-doctors.ts remove 123456789012345678
 *   npx tsx scripts/manage-doctors.ts list
 *
 * Скрипт викликає `wrangler kv key ...` під капотом — переконайтеся,
 * що ви авторизовані в wrangler (`npx wrangler login`) і що в
 * wrangler.toml вказано правильний id KV namespace.
 */
import { execSync } from "node:child_process";

const KV_BINDING = "AUTH_KV";

function run(cmd: string): string {
  return execSync(cmd, { encoding: "utf-8", cwd: __dirname + "/.." });
}

function addDoctor(discordId: string, name: string, role: string) {
  const value = JSON.stringify({ discordId, name, role });
  const cmd = `npx wrangler kv key put --binding=${KV_BINDING} --remote "doctor:${discordId}" '${value}'`;
  console.log(run(cmd));
  console.log(`✓ Додано: ${name} (${role}) — Discord ID ${discordId}`);
}

function removeDoctor(discordId: string) {
  const cmd = `npx wrangler kv key delete --binding=${KV_BINDING} --remote "doctor:${discordId}"`;
  console.log(run(cmd));
  console.log(`✓ Видалено Discord ID ${discordId}`);
}

function listDoctors() {
  const cmd = `npx wrangler kv key list --binding=${KV_BINDING} --remote --prefix="doctor:"`;
  console.log(run(cmd));
}

const [, , action, ...args] = process.argv;

switch (action) {
  case "add": {
    const [discordId, name, role] = args;
    if (!discordId || !name || !role) {
      console.error('Використання: add <discordId> "<Ім\'я>" "<Посада>"');
      process.exit(1);
    }
    addDoctor(discordId, name, role);
    break;
  }
  case "remove": {
    const [discordId] = args;
    if (!discordId) {
      console.error("Використання: remove <discordId>");
      process.exit(1);
    }
    removeDoctor(discordId);
    break;
  }
  case "list":
    listDoctors();
    break;
  default:
    console.log("Використання: add | remove | list");
}
