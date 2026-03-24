export interface Task {
  id: number;
  title: string;
  description?: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  completed: boolean;
  category: string;
  alarmEnabled: boolean;
  createdAt: string;
}

export type NewTask = Omit<Task, 'id' | 'completed' | 'createdAt'>;
