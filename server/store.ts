import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Store } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(PROJECT_ROOT, "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");
const TEMP_PATH = path.join(DATA_DIR, "store.json.tmp");

const EMPTY_STORE: Store = { screens: [] };

export function getStorePath(): string {
  return STORE_PATH;
}

async function ensureDataDir(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
}

export async function loadStore(): Promise<Store> {
  await ensureDataDir();
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Store;
    if (!parsed || !Array.isArray(parsed.screens)) {
      return { ...EMPTY_STORE };
    }
    return parsed;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      await saveStore(EMPTY_STORE);
      return { ...EMPTY_STORE };
    }
    throw err;
  }
}

export async function saveStore(store: Store): Promise<void> {
  await ensureDataDir();
  const payload = `${JSON.stringify(store, null, 2)}\n`;
  await writeFile(TEMP_PATH, payload, "utf8");
  await rename(TEMP_PATH, STORE_PATH);
}

export async function updateStore(
  mutator: (store: Store) => void | Store,
): Promise<Store> {
  const store = await loadStore();
  const result = mutator(store);
  const next = result ?? store;
  await saveStore(next);
  return next;
}
