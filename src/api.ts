import type { Priority, Screen, Status, Store, SubTask } from "./types";

const STORE_KEY = "ui-screen-task-manager:store";

function now(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

function readStore(): Store {
  const raw = localStorage.getItem(STORE_KEY);
  if (!raw) return { screens: [] };
  try {
    const parsed = JSON.parse(raw) as Store;
    if (!parsed || !Array.isArray(parsed.screens)) return { screens: [] };
    return parsed;
  } catch {
    return { screens: [] };
  }
}

function writeStore(store: Store): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

function findScreen(store: Store, id: string): Screen | undefined {
  return store.screens.find((s) => s.id === id);
}

/** Seed from public/store.json on first visit (when localStorage is empty). */
export async function ensureSeeded(): Promise<void> {
  if (localStorage.getItem(STORE_KEY)) return;
  try {
    const base = import.meta.env.BASE_URL;
    const res = await fetch(`${base}store.json`);
    if (!res.ok) return;
    const seed = (await res.json()) as Store;
    if (seed && Array.isArray(seed.screens)) {
      writeStore(seed);
    }
  } catch {
    // ignore — start empty
  }
}

export function fetchScreens(): Promise<Store> {
  return Promise.resolve(readStore());
}

export function createScreen(input: {
  name: string;
  description?: string;
  status?: Status;
  priority?: Priority;
}): Promise<Screen> {
  const timestamp = now();
  const screen: Screen = {
    id: newId(),
    name: input.name.trim(),
    description: input.description ?? "",
    status: input.status ?? "todo",
    priority: input.priority ?? "medium",
    subTasks: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const store = readStore();
  store.screens.push(screen);
  writeStore(store);
  return Promise.resolve(screen);
}

export function updateScreen(
  id: string,
  input: Partial<{
    name: string;
    description: string;
    status: Status;
    priority: Priority;
  }>,
): Promise<Screen> {
  const store = readStore();
  const screen = findScreen(store, id);
  if (!screen) return Promise.reject(new Error("Screen not found"));
  if (input.name !== undefined) screen.name = input.name.trim();
  if (input.description !== undefined) screen.description = input.description;
  if (input.status !== undefined) screen.status = input.status;
  if (input.priority !== undefined) screen.priority = input.priority;
  screen.updatedAt = now();
  writeStore(store);
  return Promise.resolve(screen);
}

export function deleteScreen(id: string): Promise<void> {
  const store = readStore();
  const before = store.screens.length;
  store.screens = store.screens.filter((s) => s.id !== id);
  if (store.screens.length === before) {
    return Promise.reject(new Error("Screen not found"));
  }
  writeStore(store);
  return Promise.resolve();
}

export function createSubTask(
  screenId: string,
  input: { title: string; status?: Status; notes?: string },
): Promise<SubTask> {
  const store = readStore();
  const screen = findScreen(store, screenId);
  if (!screen) return Promise.reject(new Error("Screen not found"));
  const timestamp = now();
  const subTask: SubTask = {
    id: newId(),
    title: input.title.trim(),
    status: input.status ?? "todo",
    notes: input.notes ?? "",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  screen.subTasks.push(subTask);
  screen.updatedAt = timestamp;
  writeStore(store);
  return Promise.resolve(subTask);
}

export function updateSubTask(
  screenId: string,
  subTaskId: string,
  input: Partial<{ title: string; status: Status; notes: string }>,
): Promise<SubTask> {
  const store = readStore();
  const screen = findScreen(store, screenId);
  if (!screen) return Promise.reject(new Error("Screen not found"));
  const subTask = screen.subTasks.find((t) => t.id === subTaskId);
  if (!subTask) return Promise.reject(new Error("Sub-task not found"));
  if (input.title !== undefined) subTask.title = input.title.trim();
  if (input.status !== undefined) subTask.status = input.status;
  if (input.notes !== undefined) subTask.notes = input.notes;
  subTask.updatedAt = now();
  screen.updatedAt = subTask.updatedAt;
  writeStore(store);
  return Promise.resolve(subTask);
}

export function deleteSubTask(
  screenId: string,
  subTaskId: string,
): Promise<void> {
  const store = readStore();
  const screen = findScreen(store, screenId);
  if (!screen) return Promise.reject(new Error("Screen not found"));
  const before = screen.subTasks.length;
  screen.subTasks = screen.subTasks.filter((t) => t.id !== subTaskId);
  if (screen.subTasks.length === before) {
    return Promise.reject(new Error("Sub-task not found"));
  }
  screen.updatedAt = now();
  writeStore(store);
  return Promise.resolve();
}
