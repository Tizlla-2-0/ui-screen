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
