import { format, getISOWeek, getYear } from "date-fns";

export const getCurrentWeekKey = () => {
  const now = new Date();
  const year = getYear(now);
  const week = getISOWeek(now);
  return `${year}-W${String(week).padStart(2, '0')}`;
};

export const getWeekRangeString = (date: Date = new Date()) => {
  const start = format(date, "MM/dd");
  return start; 
};
