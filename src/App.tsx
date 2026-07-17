import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createScreen,
  createSubTask,
  deleteScreen,
  deleteSubTask,
  ensureSeeded,
  fetchScreens,
  updateScreen,
  updateSubTask,
} from "./api";
import { isAuthenticated, logout } from "./auth";
import { Login } from "./components/Login";
import { ScreenDetail } from "./components/ScreenDetail";
import { ScreenList } from "./components/ScreenList";
import type { Priority, Screen, Status } from "./types";
import "./App.css";

function App() {
  const [authed, setAuthed] = useState(() => isAuthenticated());
  const [screens, setScreens] = useState<Screen[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const store = await fetchScreens();
    setScreens(store.screens);
    return store.screens;
  }, []);

  useEffect(() => {
    if (!authed) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await ensureSeeded();
        const list = await reload();
        if (!cancelled && list.length > 0) {
          setSelectedId((current) => current ?? list[0].id);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authed, reload]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return screens.filter((screen) => {
      if (statusFilter !== "all" && screen.status !== statusFilter) return false;
      if (priorityFilter !== "all" && screen.priority !== priorityFilter) {
        return false;
      }
      if (q && !screen.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [screens, query, statusFilter, priorityFilter]);

  const selected = screens.find((s) => s.id === selectedId) ?? null;

  if (!authed) {
    return <Login onSuccess={() => setAuthed(true)} />;
  }

  async function handleCreate() {
    try {
      setError(null);
      const screen = await createScreen({ name: "New screen" });
      await reload();
      setSelectedId(screen.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create screen");
    }
  }

  async function handleUpdate(
    id: string,
    patch: Partial<{
      name: string;
      description: string;
      status: Status;
      priority: Priority;
    }>,
  ) {
    try {
      setError(null);
      await updateScreen(id, patch);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update screen");
    }
  }

  async function handleDelete(id: string) {
    try {
      setError(null);
      await deleteScreen(id);
      const list = await reload();
      setSelectedId((current) => {
        if (current !== id) return current;
        return list[0]?.id ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete screen");
    }
  }

  async function handleAddSubTask(screenId: string) {
    try {
      setError(null);
      const subTask = await createSubTask(screenId, { title: "New sub-task" });
      await reload();
      return subTask.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add sub-task");
    }
  }

  async function handleUpdateSubTask(
    screenId: string,
    subTaskId: string,
    patch: Partial<{ title: string; status: Status; notes: string }>,
  ) {
    try {
      setError(null);
      await updateSubTask(screenId, subTaskId, patch);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update sub-task");
    }
  }

  async function handleDeleteSubTask(screenId: string, subTaskId: string) {
    try {
      setError(null);
      await deleteSubTask(screenId, subTaskId);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete sub-task");
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>UI Screen & Task Manager</h1>
          <p className="muted">
            Lightweight local tracker for screens and sub-tasks
          </p>
        </div>
        <div className="header-actions">
          {loading && <span className="muted">Loading…</span>}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              logout();
              setAuthed(false);
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      {error && (
        <div className="banner error" role="alert">
          {error}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      <main className="layout">
        <ScreenList
          screens={filtered}
          selectedId={selectedId}
          onSelect={setSelectedId}
          query={query}
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          onQueryChange={setQuery}
          onStatusFilterChange={setStatusFilter}
          onPriorityFilterChange={setPriorityFilter}
          onCreate={handleCreate}
        />
        <ScreenDetail
          screen={selected}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onAddSubTask={handleAddSubTask}
          onUpdateSubTask={handleUpdateSubTask}
          onDeleteSubTask={handleDeleteSubTask}
        />
      </main>
    </div>
  );
}

export default App;
