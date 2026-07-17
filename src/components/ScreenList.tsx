import type { Priority, Screen, Status } from "../types";
import { PRIORITY_LABELS, STATUS_LABELS } from "../types";

type Props = {
  screens: Screen[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  query: string;
  statusFilter: Status | "all";
  priorityFilter: Priority | "all";
  onQueryChange: (value: string) => void;
  onStatusFilterChange: (value: Status | "all") => void;
  onPriorityFilterChange: (value: Priority | "all") => void;
  onCreate: () => void;
};

export function ScreenList({
  screens,
  selectedId,
  onSelect,
  query,
  statusFilter,
  priorityFilter,
  onQueryChange,
  onStatusFilterChange,
  onPriorityFilterChange,
  onCreate,
}: Props) {
  return (
    <aside className="panel list-panel">
      <div className="panel-header">
        <h2>Screens</h2>
        <button type="button" className="btn btn-primary" onClick={onCreate}>
          New screen
        </button>
      </div>

      <div className="filters">
        <input
          type="search"
          className="input"
          placeholder="Search screens…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
        <div className="filter-row">
          <label className="field">
            <span>Status</span>
            <select
              className="select"
              value={statusFilter}
              onChange={(e) =>
                onStatusFilterChange(e.target.value as Status | "all")
              }
            >
              <option value="all">All</option>
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </label>
          <label className="field">
            <span>Priority</span>
            <select
              className="select"
              value={priorityFilter}
              onChange={(e) =>
                onPriorityFilterChange(e.target.value as Priority | "all")
              }
            >
              <option value="all">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
        </div>
      </div>

      <ul className="screen-list">
        {screens.length === 0 ? (
          <li className="empty-state">No screens match your filters.</li>
        ) : (
          screens.map((screen) => {
            const doneCount = screen.subTasks.filter(
              (t) => t.status === "done",
            ).length;
            return (
              <li key={screen.id}>
                <button
                  type="button"
                  className={`screen-item${selectedId === screen.id ? " selected" : ""}`}
                  onClick={() => onSelect(screen.id)}
                >
                  <div className="screen-item-top">
                    <span className="screen-name">{screen.name}</span>
                    <span className={`badge priority-${screen.priority}`}>
                      {PRIORITY_LABELS[screen.priority]}
                    </span>
                  </div>
                  <div className="screen-item-meta">
                    <span className={`badge status-${screen.status}`}>
                      {STATUS_LABELS[screen.status]}
                    </span>
                    <span className="muted" title="Completed / total sub-tasks">
                      {doneCount}/{screen.subTasks.length}
                    </span>
                  </div>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </aside>
  );
}
