import { execSync } from "node:child_process";

const KV_BINDING = "AUTH_KV";

function run(cmd: string): string {
  return execSync(cmd, { encoding: "utf-8", cwd: __dirname + "/.." });
}

function addDoctor(discordId: string, name: string, role: string, isAdmin: boolean = false) {
  const doctor: any = { discordId, name, role };
  if (isAdmin) doctor.isAdmin = true;
  const value = JSON.stringify(doctor);
  const cmd = `npx wrangler kv key put --binding=${KV_BINDING} --remote "doctor:${discordId}" '${value}'`;
  console.log(run(cmd));
  console.log(`✓ Додано: ${name} (${role}) — Discord ID ${discordId}${isAdmin ? ' [ADMIN]' : ''}`);
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
    const discordId = args[0];
    const name = args[1];
    const role = args[2];
    const isAdmin = args.includes("--admin");
    if (!discordId || !name || !role) {
      console.error('Використання: add <discordId> "<Ім\'я>" "<Посада>" [--admin]');
      process.exit(1);
    }
    addDoctor(discordId, name, role, isAdmin);
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