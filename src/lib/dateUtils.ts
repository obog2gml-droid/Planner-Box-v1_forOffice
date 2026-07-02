import { format, getISOWeek, getYear, setISOWeek, setISOWeekYear, startOfISOWeek, getWeekOfMonth } from "date-fns";

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

export const getDefaultTitleFromWeekKey = (weekKey: string): string => {
  const parts = weekKey.match(/^(\d{4})-W(\d{2})$/);
  if (!parts) return weekKey;
  const year = parseInt(parts[1], 10);
  const week = parseInt(parts[2], 10);

  // Set the year and week to a base date, then get start of that ISO week
  const baseDate = new Date();
  const dateWithYear = setISOWeekYear(baseDate, year);
  const dateWithWeek = setISOWeek(dateWithYear, week);
  const weekStart = startOfISOWeek(dateWithWeek);

  const weekNum = getWeekOfMonth(weekStart);
  const weekText = ["첫", "둘", "셋", "넷", "다섯", "여섯"][weekNum - 1] || "첫";
  return `${format(weekStart, "yyMM")} ${weekText}째 주`;
};

export const getMonthLabelFromWeekKey = (weekKey: string): string => {
  const parts = weekKey.match(/^(\d{4})-W(\d{2})$/);
  if (!parts) return "기타";
  const year = parseInt(parts[1], 10);
  const week = parseInt(parts[2], 10);

  const baseDate = new Date();
  const dateWithYear = setISOWeekYear(baseDate, year);
  const dateWithWeek = setISOWeek(dateWithYear, week);
  const weekStart = startOfISOWeek(dateWithWeek);

  return format(weekStart, "yyyy년 MM월");
};


