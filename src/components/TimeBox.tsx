"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { addDays, format, startOfWeek } from "date-fns";
import { Task } from "@/lib/types";
import { TaskBlock } from "@/components/TaskBlock";

interface TimeBoxProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  printMode?: "all" | "table" | null;
}

const START_HOUR = 9;
const END_HOUR = 19;
const DAYS = ["월", "화", "수", "목", "금"];
const MID_HOURS = new Set([11, 17]);

const TOTAL_HOURS = END_HOUR - START_HOUR;
const HOURS = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

export const TimeBox: React.FC<TimeBoxProps> = ({ tasks, setTasks, printMode = null }) => {
  const layerRef = useRef<HTMLDivElement>(null);
  const [columnWidth, setColumnWidth] = useState(0);
  const hourHeight = printMode === "table" ? 66 : printMode === "all" ? 58 : 72;

  useEffect(() => {
    if (!layerRef.current) return;

    const updateWidth = () => {
      if (!layerRef.current) return;
      setColumnWidth(layerRef.current.clientWidth / 5);
    };

    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(layerRef.current);

    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!layerRef.current) return;
    setColumnWidth(layerRef.current.clientWidth / 5);
  }, [printMode]);

  useEffect(() => {
    const normalized = tasks.map(normalizeTask);
    if (!areTasksEqual(tasks, normalized)) {
      setTasks(normalized);
    }
  }, [tasks, setTasks]);

  const dayDates = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return DAYS.map((name, i) => {
      const date = addDays(start, i);
      return {
        name,
        date: format(date, "MM.dd"),
      };
    });
  }, []);

  const checkCollision = (
    taskId: string,
    dayOfWeek: number,
    startTime: number,
    duration: number,
    taskList: Task[] = tasks
  ) => {
    const endTime = startTime + duration;
    return taskList.some((task) => {
      if (task.id === taskId) return false;
      if (task.dayOfWeek !== dayOfWeek) return false;

      const taskEnd = task.startTime + task.duration;
      return startTime < taskEnd && endTime > task.startTime;
    });
  };

  const hasAnyCollision = (taskList: Task[]) => {
    for (let i = 0; i < taskList.length; i += 1) {
      for (let j = i + 1; j < taskList.length; j += 1) {
        const a = taskList[i];
        const b = taskList[j];
        if (a.dayOfWeek !== b.dayOfWeek) continue;

        const overlap = a.startTime < b.startTime + b.duration && a.startTime + a.duration > b.startTime;
        if (overlap) return true;
      }
    }
    return false;
  };

  const handleUpdate = (id: string, updates: Partial<Task>) => {
    const source = tasks.find((task) => task.id === id);
    if (!source) return false;

    const day = Math.max(0, Math.min(4, updates.dayOfWeek ?? source.dayOfWeek));
    const start = updates.startTime ?? source.startTime;
    const duration = Math.max(0.5, updates.duration ?? source.duration);
    const end = start + duration;

    if (start < START_HOUR || end > END_HOUR) return false;

    const collidingTask = tasks.find((task) => {
      if (task.id === id || task.dayOfWeek !== day) return false;
      const taskEnd = task.startTime + task.duration;
      return start < taskEnd && end > task.startTime;
    });

    if (!collidingTask) {
      setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, ...updates, dayOfWeek: day } : task)));
      return true;
    }

    const collidingEnd = collidingTask.startTime + collidingTask.duration;
    const overlapStart = Math.max(start, collidingTask.startTime);
    const overlapEnd = Math.min(end, collidingEnd);
    const overlap = Math.max(0, overlapEnd - overlapStart);
    const overlapRatio = overlap / collidingTask.duration;

    if (overlapRatio >= 0.7) {
      const swapped = tasks.map((task) => {
        if (task.id === id) {
          return { ...task, dayOfWeek: collidingTask.dayOfWeek, startTime: collidingTask.startTime };
        }
        if (task.id === collidingTask.id) {
          return { ...task, dayOfWeek: source.dayOfWeek, startTime: source.startTime };
        }
        return task;
      });

      if (!hasAnyCollision(swapped)) {
        setTasks(swapped);
        return true;
      }
    }

    if (overlapRatio < 0.3) {
      let snappedStart = start < collidingTask.startTime ? collidingTask.startTime - duration : collidingEnd;
      snappedStart = Math.round(snappedStart * 4) / 4;
      const snappedEnd = snappedStart + duration;

      if (snappedStart >= START_HOUR && snappedEnd <= END_HOUR) {
        const snapped = tasks.map((task) =>
          task.id === id ? { ...task, dayOfWeek: day, startTime: snappedStart, duration } : task
        );

        if (!hasAnyCollision(snapped)) {
          setTasks(snapped);
          return true;
        }
      }
    }

    return false;
  };

  const handleDelete = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const handleBackgroundClick = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || columnWidth <= 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dayOfWeek = Math.max(0, Math.min(4, Math.floor(x / columnWidth)));
    const step = hourHeight / 4;
    const snappedY = Math.floor(y / step) * step;

    let startTime = START_HOUR + snappedY / hourHeight;
    const duration = 1;

    if (startTime >= END_HOUR) return;
    if (startTime + duration > END_HOUR) {
      startTime = END_HOUR - duration;
    }

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: "",
      dayOfWeek,
      startTime,
      duration,
      color: "neutral",
      isMissed: false,
    };

    if (!checkCollision(newTask.id, dayOfWeek, startTime, duration)) {
      setTasks((prev) => [...prev, newTask]);
    }
  };

  const clearAll = () => {
    if (confirm("정말 모든 일정을 지우시겠습니까?")) {
      setTasks([]);
    }
  };

  return (
    <section
      className={`timetable ${printMode ? "print-mode" : ""} ${printMode === "table" ? "print-table" : ""}`}
      style={{ "--hour-h": `${hourHeight}px` } as React.CSSProperties}
    >
      <div className="tt-inner">
        <div className="tt-head">
          <div className="tt-spacer" />
          {dayDates.map((day) => (
            <div className="tt-day" key={`${day.name}-${day.date}`}>
              <span className="d-date">{day.date}</span>
              <span className="d-name">{day.name}</span>
            </div>
          ))}
        </div>

        <div className="tt-body">
          <div className="tt-axis">
            {HOURS.map((hour) => (
              <div key={`axis-${hour}`} className="ax" style={{ top: `${(hour - START_HOUR) * hourHeight}px` }}>
                {hour}
              </div>
            ))}
          </div>

          <div className="grid-wrap">
            <div className="rows" aria-hidden>
              {Array.from({ length: TOTAL_HOURS }).map((_, index) => {
                const hour = START_HOUR + index;
                return <div key={`row-${hour}`} className={`row ${MID_HOURS.has(hour) ? "mid" : ""}`} />;
              })}
            </div>

            <div className="cols" aria-hidden>
              {DAYS.map((day) => (
                <div key={`col-${day}`} className="col" />
              ))}
            </div>

            <div ref={layerRef} className="task-layer" onPointerDown={handleBackgroundClick}>
              {columnWidth > 0
                ? tasks.map((task) => (
                    <TaskBlock
                      key={task.id}
                      task={task}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                      hourHeight={hourHeight}
                      startHour={START_HOUR}
                      endHour={END_HOUR}
                      columnWidth={columnWidth}
                      printMode={printMode}
                    />
                  ))
                : null}
            </div>
          </div>
        </div>
      </div>

      <div className="tt-footer">
        <button type="button" className="btn text danger" onClick={clearAll}>
          전체 삭제
        </button>
      </div>
    </section>
  );
};

function normalizeTask(task: Task): Task {
  const dayOfWeek = Math.max(0, Math.min(4, Math.round(task.dayOfWeek)));

  const safeDuration = Number.isFinite(task.duration) ? task.duration : 1;
  const duration = Math.max(0.5, Math.min(END_HOUR - START_HOUR, Math.round(safeDuration * 4) / 4));

  const safeStart = Number.isFinite(task.startTime) ? task.startTime : START_HOUR;
  const snappedStart = Math.round(safeStart * 4) / 4;
  const maxStart = END_HOUR - duration;
  const startTime = Math.max(START_HOUR, Math.min(maxStart, snappedStart));

  return {
    ...task,
    dayOfWeek,
    startTime,
    duration,
  };
}

function areTasksEqual(a: Task[], b: Task[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (
      a[i].id !== b[i].id ||
      a[i].title !== b[i].title ||
      a[i].dayOfWeek !== b[i].dayOfWeek ||
      a[i].startTime !== b[i].startTime ||
      a[i].duration !== b[i].duration ||
      a[i].color !== b[i].color ||
      a[i].isMissed !== b[i].isMissed
    ) {
      return false;
    }
  }
  return true;
}
