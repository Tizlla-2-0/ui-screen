import { loadStoreFromGitHub, saveStoreToGitHub } from "./githubStore";
import type { Priority, Screen, Status, Store, SubTask } from "./types";

let cache: Store | null = null;
let sha: string | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function now(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

function findScreen(store: Store, id: string): Screen | undefined {
  return store.screens.find((s) => s.id === id);
}

async function ensureLoaded(): Promise<Store> {
  if (cache && sha) return cache;
  const loaded = await loadStoreFromGitHub();
  cache = loaded.store;
  sha = loaded.sha;
  return cache;
}

async function persist(next: Store): Promise<void> {
  cache = next;
  writeQueue = writeQueue.then(async () => {
    if (!sha) {
      const loaded = await loadStoreFromGitHub();
      sha = loaded.sha;
    }
    try {
      sha = await saveStoreToGitHub(next, sha!);
    } catch (err) {
      // On SHA conflict, reload and retry once
      const message = err instanceof Error ? err.message : "";
      if (message.includes("409") || message.includes("sha")) {
        const loaded = await loadStoreFromGitHub();
        sha = loaded.sha;
        // Keep our next as source of truth for this client
        sha = await saveStoreToGitHub(next, sha);
        return;
      }
      throw err;
    }
  });
  await writeQueue;
}

export async function ensureSeeded(): Promise<void> {
  await ensureLoaded();
}

export async function fetchScreens(): Promise<Store> {
  const store = await ensureLoaded();
  return structuredClone(store);
}

export async function createScreen(input: {
  name: string;
  description?: string;
  status?: Status;
  priority?: Priority;
}): Promise<Screen> {
  const store = await ensureLoaded();
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
  const next = { screens: [...store.screens, screen] };
  await persist(next);
  return screen;
}

export async function updateScreen(
  id: string,
  input: Partial<{
    name: string;
    description: string;
    status: Status;
    priority: Priority;
  }>,
): Promise<Screen> {
  const store = await ensureLoaded();
  const screen = findScreen(store, id);
  if (!screen) throw new Error("Screen not found");
  const updated: Screen = {
    ...screen,
    name: input.name !== undefined ? input.name.trim() : screen.name,
    description:
      input.description !== undefined ? input.description : screen.description,
    status: input.status !== undefined ? input.status : screen.status,
    priority: input.priority !== undefined ? input.priority : screen.priority,
    updatedAt: now(),
  };
  const next = {
    screens: store.screens.map((s) => (s.id === id ? updated : s)),
  };
  await persist(next);
  return updated;
}

export async function deleteScreen(id: string): Promise<void> {
  const store = await ensureLoaded();
  const before = store.screens.length;
  const next = { screens: store.screens.filter((s) => s.id !== id) };
  if (next.screens.length === before) throw new Error("Screen not found");
  await persist(next);
}

export async function createSubTask(
  screenId: string,
  input: { title: string; status?: Status; notes?: string },
): Promise<SubTask> {
  const store = await ensureLoaded();
  const screen = findScreen(store, screenId);
  if (!screen) throw new Error("Screen not found");
  const timestamp = now();
  const subTask: SubTask = {
    id: newId(),
    title: input.title.trim(),
    status: input.status ?? "todo",
    notes: input.notes ?? "",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const updatedScreen: Screen = {
    ...screen,
    subTasks: [...screen.subTasks, subTask],
    updatedAt: timestamp,
  };
  const next = {
    screens: store.screens.map((s) => (s.id === screenId ? updatedScreen : s)),
  };
  await persist(next);
  return subTask;
}

export async function updateSubTask(
  screenId: string,
  subTaskId: string,
  input: Partial<{ title: string; status: Status; notes: string }>,
): Promise<SubTask> {
  const store = await ensureLoaded();
  const screen = findScreen(store, screenId);
  if (!screen) throw new Error("Screen not found");
  const subTask = screen.subTasks.find((t) => t.id === subTaskId);
  if (!subTask) throw new Error("Sub-task not found");
  const updatedSub: SubTask = {
    ...subTask,
    title: input.title !== undefined ? input.title.trim() : subTask.title,
    status: input.status !== undefined ? input.status : subTask.status,
    notes: input.notes !== undefined ? input.notes : subTask.notes,
    updatedAt: now(),
  };
  const updatedScreen: Screen = {
    ...screen,
    subTasks: screen.subTasks.map((t) => (t.id === subTaskId ? updatedSub : t)),
    updatedAt: updatedSub.updatedAt,
  };
  const next = {
    screens: store.screens.map((s) => (s.id === screenId ? updatedScreen : s)),
  };
  await persist(next);
  return updatedSub;
}

export async function deleteSubTask(
  screenId: string,
  subTaskId: string,
): Promise<void> {
  const store = await ensureLoaded();
  const screen = findScreen(store, screenId);
  if (!screen) throw new Error("Screen not found");
  const before = screen.subTasks.length;
  const subTasks = screen.subTasks.filter((t) => t.id !== subTaskId);
  if (subTasks.length === before) throw new Error("Sub-task not found");
  const updatedScreen: Screen = {
    ...screen,
    subTasks,
    updatedAt: now(),
  };
  const next = {
    screens: store.screens.map((s) => (s.id === screenId ? updatedScreen : s)),
  };
  await persist(next);
}
