import { getAuthHeader } from "./auth";
import type { Priority, Screen, Status, Store, SubTask } from "./types";

const API_BASE =
  import.meta.env.VITE_API_BASE || "https://ui-screen-api.prateektomar005.workers.dev";

let cache: Store | null = null;
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

async function api<T>(method: string, body?: unknown): Promise<T> {
  const auth = getAuthHeader();
  if (!auth) throw new Error("Not signed in");

  const res = await fetch(`${API_BASE}/store`, {
    method,
    headers: {
      Authorization: auth,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // ignore
    }
    throw new Error(message || `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

async function ensureLoaded(): Promise<Store> {
  if (cache) return cache;
  const store = await api<Store>("GET");
  if (!store || !Array.isArray(store.screens)) {
    cache = { screens: [] };
  } else {
    cache = store;
  }
  return cache;
}

async function persist(next: Store): Promise<void> {
  cache = next;
  writeQueue = writeQueue.then(async () => {
    await api<Store>("PUT", next);
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
  await persist({ screens: [...store.screens, screen] });
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
  await persist({
    screens: store.screens.map((s) => (s.id === id ? updated : s)),
  });
  return updated;
}

export async function deleteScreen(id: string): Promise<void> {
  const store = await ensureLoaded();
  const before = store.screens.length;
  const screens = store.screens.filter((s) => s.id !== id);
  if (screens.length === before) throw new Error("Screen not found");
  await persist({ screens });
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
  await persist({
    screens: store.screens.map((s) => (s.id === screenId ? updatedScreen : s)),
  });
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
  await persist({
    screens: store.screens.map((s) => (s.id === screenId ? updatedScreen : s)),
  });
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
  await persist({
    screens: store.screens.map((s) => (s.id === screenId ? updatedScreen : s)),
  });
}
