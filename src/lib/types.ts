export interface Task {
  id: string;
  title: string;
  dayOfWeek: number; // 0: Mon, 1: Tue, 2: Wed, 3: Thu, 4: Fri
  startTime: number; // in hours since 00:00, e.g. 9.5 for 09:30
  duration: number; // in hours
  color: string;
  isMissed?: boolean;
}
