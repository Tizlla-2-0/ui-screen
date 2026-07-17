export type Status = "todo" | "in_progress" | "done";
export type Priority = "low" | "medium" | "high";

export type SubTask = {
  id: string;
  title: string;
  status: Status;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type Screen = {
  id: string;
  name: string;
  description?: string;
  status: Status;
  priority: Priority;
  subTasks: SubTask[];
  createdAt: string;
  updatedAt: string;
};

export type Store = {
  screens: Screen[];
};

export const STATUS_LABELS: Record<Status, string> = {
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const STATUSES: Status[] = ["todo", "in_progress", "done"];
export const PRIORITIES: Priority[] = ["low", "medium", "high"];
