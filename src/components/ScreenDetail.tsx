import { useEffect, useRef, useState } from "react";
import type { Priority, Screen, Status } from "../types";
import {
  PRIORITIES,
  PRIORITY_LABELS,
  STATUSES,
  STATUS_LABELS,
} from "../types";
import { SubTaskList } from "./SubTaskList";

type Props = {
  screen: Screen | null;
  onUpdate: (
    id: string,
    patch: Partial<{
      name: string;
      description: string;
      status: Status;
      priority: Priority;
    }>,
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAddSubTask: (screenId: string) => Promise<string | void>;
  onUpdateSubTask: (
    screenId: string,
    subTaskId: string,
    patch: Partial<{ title: string; status: Status; notes: string }>,
  ) => Promise<void>;
  onDeleteSubTask: (screenId: string, subTaskId: string) => Promise<void>;
};

export function ScreenDetail({
  screen,
  onUpdate,
  onDelete,
  onAddSubTask,
  onUpdateSubTask,
  onDeleteSubTask,
}: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>("todo");
  const [priority, setPriority] = useState<Priority>("medium");
  const [saving, setSaving] = useState(false);
  const [focusSubTaskId, setFocusSubTaskId] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const prevScreenId = useRef<string | null>(null);

  useEffect(() => {
    if (!screen) return;
    setName(screen.name);
    setDescription(screen.description ?? "");
    setStatus(screen.status);
    setPriority(screen.priority);

    const isNewSelection = prevScreenId.current !== screen.id;
    prevScreenId.current = screen.id;
    if (isNewSelection && screen.name === "New screen") {
      requestAnimationFrame(() => {
        nameRef.current?.focus();
        nameRef.current?.select();
      });
    }
  }, [screen]);

  if (!screen) {
    return (
      <section className="panel detail-panel">
        <div className="empty-detail">
          <h2>Select a screen</h2>
          <p className="muted">
            Choose a screen from the list, or create a new one to start tracking
            sub-tasks.
          </p>
        </div>
      </section>
    );
  }

  const current = screen;

  async function save() {
    setSaving(true);
    try {
      await onUpdate(current.id, {
        name: name.trim() || current.name,
        description,
        status,
        priority,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete screen “${current.name}” and all its sub-tasks?`)) {
      return;
    }
    await onDelete(current.id);
  }

  async function handleAddSubTask() {
    const id = await onAddSubTask(current.id);
    if (typeof id === "string") {
      setFocusSubTaskId(id);
    }
  }

  return (
    <section className="panel detail-panel">
      <div className="panel-header">
        <h2>Screen details</h2>
        <div className="header-actions">
          <button
            type="button"
            className="btn"
            onClick={save}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>
      </div>

      <div className="detail-form">
        <label className="field">
          <span>Name</span>
          <input
            ref={nameRef}
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <div className="filter-row">
          <label className="field">
            <span>Status</span>
            <select
              className="select"
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Priority</span>
            <select
              className="select"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="field">
          <span>Description</span>
          <textarea
            className="textarea"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notes about this screen…"
          />
        </label>
      </div>

      <SubTaskList
        subTasks={current.subTasks}
        onAdd={handleAddSubTask}
        onUpdate={(subTaskId, patch) =>
          onUpdateSubTask(current.id, subTaskId, patch)
        }
        onDelete={(subTaskId) => onDeleteSubTask(current.id, subTaskId)}
        focusSubTaskId={focusSubTaskId}
        onFocused={() => setFocusSubTaskId(null)}
      />
    </section>
  );
}
