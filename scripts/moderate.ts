import { execSync } from "node:child_process";
import { createInterface } from "node:readline/promises";

const DB = "paintings";
const WIDTH = 8;

const PALETTE = [
  [0x46, 0x42, 0x5e],
  [0x15, 0x78, 0x8c],
  [0x00, 0xb9, 0xbe],
  [0xff, 0xee, 0xcc],
  [0xff, 0xb0, 0xa3],
  [0xff, 0x69, 0x73],
] as const;

function wrangler(sql: string): unknown[] {
  const out = execSync(
    `wrangler d1 execute ${DB} --remote --json --command ${JSON.stringify(sql)}`,
    { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024, env: { ...process.env } },
  );
  const parsed = JSON.parse(out);
  return parsed[0]?.results ?? [];
}

function renderLines(data: number[]): string[] {
  const lines: string[] = [];
  for (let y = 0; y < WIDTH; y++) {
    let line = "";
    for (let x = 0; x < WIDTH; x++) {
      const idx = data[y * WIDTH + x];
      const [r, g, b] = PALETTE[idx] ?? [0, 0, 0];
      line += `\x1b[48;2;${r};${g};${b}m  \x1b[0m`;
    }
    lines.push(line);
  }
  return lines;
}

function parseHexData(hex: string): number[] {
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }
  return bytes;
}

function list(limit = 30) {
  const rows = wrangler(
    `SELECT id, hex(data) as hex_data FROM Paintings ORDER BY id DESC LIMIT ${limit}`,
  ) as { id: number; hex_data: string }[];

  if (rows.length === 0) {
    console.log("no paintings found");
    return;
  }

  const cols = Math.max(1, Math.floor((process.stdout.columns || 80) / 20));
  const painted = rows.map((row) => ({
    id: row.id,
    lines: renderLines(parseHexData(row.hex_data)),
  }));

  for (let i = 0; i < painted.length; i += cols) {
    const batch = painted.slice(i, i + cols);
    const header = batch.map((p) => `#${p.id}`.padEnd(18)).join("  ");
    console.log(`\n${header}`);
    for (let y = 0; y < WIDTH; y++) {
      console.log(batch.map((p) => p.lines[y]).join("  "));
    }
  }
}

async function confirm(prompt: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(`${prompt} [y/N] `);
  rl.close();
  return answer.toLowerCase() === "y";
}

async function del(id: number) {
  const rows = wrangler(
    `SELECT id, hex(data) as hex_data, author_ip FROM Paintings WHERE id = ${id}`,
  ) as { id: number; hex_data: string; author_ip: string }[];

  if (rows.length === 0) {
    console.error(`no painting with id ${id}`);
    process.exit(1);
  }

  console.log(`deleting painting id ${id} (ip: ${rows[0].author_ip}):`);
  console.log(renderLines(parseHexData(rows[0].hex_data)).join("\n"));

  if (!(await confirm("confirm delete?"))) {
    console.log("cancelled.");
    return;
  }

  wrangler(`DELETE FROM Paintings WHERE id = ${id}`);
  console.log("deleted.");
}

const [cmd, ...args] = process.argv.slice(2);

switch (cmd) {
  case "list":
    list(args[0] ? parseInt(args[0]) : undefined);
    break;
  case "delete":
    if (!args[0]) {
      console.error("usage: moderate.ts delete <id>");
      process.exit(1);
    }
    await del(parseInt(args[0]));
    break;
  default:
    console.log("usage: moderate.ts <list [n] | delete <id>>");
}
