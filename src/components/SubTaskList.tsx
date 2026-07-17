import { useEffect, useRef, useState } from "react";
import type { Status, SubTask } from "../types";
import { STATUSES, STATUS_LABELS } from "../types";

type Props = {
  subTasks: SubTask[];
  onAdd: () => Promise<void>;
  onUpdate: (
    subTaskId: string,
    patch: Partial<{ title: string; status: Status; notes: string }>,
  ) => Promise<void>;
  onDelete: (subTaskId: string) => Promise<void>;
  focusSubTaskId?: string | null;
  onFocused?: () => void;
};

function SubTaskRow({
  task,
  onUpdate,
  onDelete,
  autoFocus,
  onFocused,
}: {
  task: SubTask;
  onUpdate: Props["onUpdate"];
  onDelete: Props["onDelete"];
  autoFocus?: boolean;
  onFocused?: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const didAutoFocus = useRef(false);

  useEffect(() => {
    if (editing) return;
    setTitle(task.title);
  }, [task.title, task.id, editing]);

  useEffect(() => {
    if (!autoFocus || didAutoFocus.current) return;
    didAutoFocus.current = true;
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    input.select();
    onFocused?.();
  }, [autoFocus, onFocused]);

  async function commitTitle() {
    setEditing(false);
    const next = title.trim();
    if (!next) {
      setTitle(task.title);
      return;
    }
    if (next !== task.title) {
      await onUpdate(task.id, { title: next });
    }
  }

  return (
    <li className="subtask-item">
      <input
        ref={inputRef}
        className="input subtask-title"
        value={title}
        placeholder="Sub-task title"
        onFocus={() => setEditing(true)}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => {
          void commitTitle();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
        }}
      />
      <select
        className="select subtask-status"
        value={task.status}
        onChange={(e) =>
          void onUpdate(task.id, { status: e.target.value as Status })
        }
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="btn btn-ghost subtask-delete"
        title="Delete sub-task"
        onClick={() => void onDelete(task.id)}
      >
        ×
      </button>
    </li>
  );
}

export function SubTaskList({
  subTasks,
  onAdd,
  onUpdate,
  onDelete,
  focusSubTaskId,
  onFocused,
}: Props) {
  const [adding, setAdding] = useState(false);
  const doneCount = subTasks.filter((t) => t.status === "done").length;
  const totalCount = subTasks.length;

  async function handleAdd() {
    setAdding(true);
    try {
      await onAdd();
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="subtasks">
      <div className="subtasks-header">
        <div className="subtasks-title">
          <h3>Sub-tasks</h3>
          <span className="muted subtask-progress" title="Completed / total">
            {doneCount}/{totalCount}
          </span>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => void handleAdd()}
          disabled={adding}
        >
          {adding ? "Adding…" : "Add sub-task"}
        </button>
      </div>

      <ul className="subtask-list">
        {subTasks.length === 0 ? (
          <li className="empty-state">No sub-tasks yet.</li>
        ) : (
          subTasks.map((task) => (
            <SubTaskRow
              key={task.id}
              task={task}
              onUpdate={onUpdate}
              onDelete={onDelete}
              autoFocus={focusSubTaskId === task.id}
              onFocused={onFocused}
            />
          ))
        )}
      </ul>
    </div>
  );
}
