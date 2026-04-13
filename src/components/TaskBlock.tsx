"use client";

import React, { useMemo, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { Task } from "@/lib/types";

interface TaskBlockProps {
  task: Task;
  onUpdate: (id: string, updates: Partial<Task>) => boolean;
  onDelete: (id: string) => void;
  hourHeight: number;
  startHour: number;
  endHour: number;
  columnWidth: number;
  printMode?: "all" | "table" | null;
}

const POST_IT_COLORS = [
  { bg: "rgba(255, 93, 93, 0.34)", border: "rgba(184, 32, 45, 0.95)", text: "#2b1111" },
  { bg: "rgba(255, 209, 75, 0.4)", border: "rgba(184, 124, 7, 0.95)", text: "#2d2207" },
  { bg: "rgba(86, 234, 160, 0.34)", border: "rgba(19, 138, 84, 0.92)", text: "#0d2e20" },
  { bg: "rgba(78, 162, 255, 0.33)", border: "rgba(26, 89, 180, 0.92)", text: "#10203d" },
  { bg: "rgba(255, 119, 57, 0.34)", border: "rgba(186, 72, 18, 0.95)", text: "#32190e" },
];

export const TaskBlock: React.FC<TaskBlockProps> = ({
  task,
  onUpdate,
  onDelete,
  hourHeight,
  startHour,
  endHour,
  columnWidth,
  printMode = null,
}) => {
  const rndRef = useRef<Rnd | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [timeStr, setTimeStr] = useState("");

  const x = task.dayOfWeek * columnWidth + 2;
  const y = (task.startTime - startHour) * hourHeight + 1;
  const width = Math.max(columnWidth - 4, 80);
  const height = Math.max(task.duration * hourHeight - 2, hourHeight * 0.5 - 2);
  const displayTimeStr = `${formatTime(task.startTime)} – ${formatTime(task.startTime + task.duration)}`;

  const postItStyle = useMemo<React.CSSProperties>(() => {
    const hash = [...task.id].reduce((acc, char) => acc + char.charCodeAt(0), 0) + task.dayOfWeek;
    const palette = POST_IT_COLORS[Math.abs(hash) % POST_IT_COLORS.length];

    return {
      "--task-bg": palette.bg,
      "--task-border": palette.border,
      "--task-text": palette.text,
      "--c": task.dayOfWeek,
      "--s": task.startTime - startHour,
      "--d": task.duration,
    } as React.CSSProperties;
  }, [task.dayOfWeek, task.id, task.startTime, task.duration, startHour]);

  const snapStep = hourHeight / 4;

  const forceSnapBack = () => {
    if (!rndRef.current) return;
    rndRef.current.updatePosition({ x, y });
    rndRef.current.updateSize({ width, height });
  };

  const handleDragStop = (_e: unknown, d: { x: number; y: number }) => {
    let day = Math.round(d.x / columnWidth);
    day = Math.max(0, Math.min(4, day));

    const newStart = startHour + Math.round(d.y / snapStep) * (snapStep / hourHeight);
    const ok = onUpdate(task.id, { dayOfWeek: day, startTime: newStart });
    if (!ok) forceSnapBack();
  };

  const handleResizeStop = (
    _e: MouseEvent | TouchEvent,
    _direction: string,
    ref: HTMLElement,
    _delta: { width: number; height: number },
    position: { x: number; y: number }
  ) => {
    const resizedHeight = ref.offsetHeight + 2;
    let duration = resizedHeight / hourHeight;
    duration = Math.max(0.5, Math.round(duration / 0.25) * 0.25);

    const newStart = startHour + Math.round(position.y / snapStep) * (snapStep / hourHeight);
    const ok = onUpdate(task.id, { startTime: newStart, duration });
    if (!ok) forceSnapBack();
  };

  const finalizeTitle = () => {
    setIsEditingTitle(false);
    onUpdate(task.id, { title: title.trim() });
  };

  const finalizeTime = () => {
    setIsEditingTime(false);
    const parsed = parseTimeRange(timeStr);
    if (!parsed) {
      setTimeStr(displayTimeStr);
      return;
    }

    const { start, end } = parsed;
    if (start < startHour || end > endHour || end <= start) {
      setTimeStr(displayTimeStr);
      return;
    }

    const ok = onUpdate(task.id, {
      startTime: start,
      duration: Math.max(0.5, end - start),
    });

    if (!ok) {
      setTimeStr(displayTimeStr);
    }
  };

  const content = (
    <div className="task-inner">
      {isEditingTitle ? (
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={finalizeTitle}
          onKeyDown={(e) => e.key === "Enter" && finalizeTitle()}
          className="task-title-input"
          onPointerDown={(e) => e.stopPropagation()}
          maxLength={50}
        />
      ) : (
        <span
          className="t-title"
          onDoubleClick={() => {
            if (printMode) return;
            setTitle(task.title);
            setIsEditingTitle(true);
          }}
        >
          {task.title || "일정"}
        </span>
      )}

      {isEditingTime ? (
        <input
          autoFocus
          value={timeStr}
          onChange={(e) => setTimeStr(e.target.value)}
          onBlur={finalizeTime}
          onKeyDown={(e) => e.key === "Enter" && finalizeTime()}
          className="task-time-input"
          onPointerDown={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          className="t-time"
          onDoubleClick={() => {
            if (printMode) return;
            setTimeStr(displayTimeStr);
            setIsEditingTime(true);
          }}
        >
          {displayTimeStr}
        </span>
      )}
    </div>
  );

  if (printMode) {
    return (
      <div className={`task ${task.isMissed ? "missed" : ""}`} style={postItStyle}>
        {content}
      </div>
    );
  }

  return (
    <Rnd
      ref={(node) => {
        rndRef.current = node;
      }}
      className={`task task-live ${task.isMissed ? "missed" : ""}`}
      bounds="parent"
      position={{ x, y }}
      size={{ width, height }}
      style={postItStyle}
      minHeight={hourHeight * 0.5}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      enableResizing={{
        top: true,
        right: false,
        bottom: true,
        left: false,
        topRight: false,
        bottomRight: false,
        bottomLeft: false,
        topLeft: false,
      }}
      resizeGrid={[1, snapStep]}
      dragGrid={[1, snapStep]}
      disableDragging={isEditingTitle || isEditingTime}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {content}

      {isHovered ? (
        <div className="task-controls" onPointerDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="task-control"
            title={task.isMissed ? "미이행 해제" : "미이행 표시"}
            onClick={() => onUpdate(task.id, { isMissed: !task.isMissed })}
          >
            {task.isMissed ? "복구" : "미이행"}
          </button>
          <button type="button" className="task-control" title="삭제" onClick={() => onDelete(task.id)}>
            삭제
          </button>
        </div>
      ) : null}
    </Rnd>
  );
};

function parseTimeRange(raw: string): { start: number; end: number } | null {
  const match = raw.trim().match(/^(\d{1,2}):?(\d{2})\s*[-–~]\s*(\d{1,2}):?(\d{2})$/);
  if (!match) return null;

  const startH = Number(match[1]);
  const startM = Number(match[2]);
  const endH = Number(match[3]);
  const endM = Number(match[4]);

  if ([startH, startM, endH, endM].some((v) => Number.isNaN(v))) return null;
  if (startM > 59 || endM > 59) return null;

  const start = startH + startM / 60;
  const end = endH + endM / 60;
  return { start, end };
}

function formatTime(timeInHours: number) {
  const h = Math.floor(timeInHours);
  const m = Math.round((timeInHours - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
