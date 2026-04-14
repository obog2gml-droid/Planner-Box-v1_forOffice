"use client";

import React, { useEffect, useRef, useState } from "react";
import { format, getWeekOfMonth, startOfWeek } from "date-fns";
import { useReactToPrint } from "react-to-print";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { TimeBox } from "@/components/TimeBox";
import { ArchiveModal } from "@/components/ArchiveModal";
import { DumpBlock } from "@/components/BrainDumpEditor";
import { Task } from "@/lib/types";
import { getCurrentWeekKey } from "@/lib/dateUtils";

interface ArchiveEntry {
  tasks: Task[];
  brainDump: DumpBlock[];
  big3: string[];
  title: string;
  subtitle: string;
}

const EMPTY_BIG3 = ["", "", ""];
type PrintTarget = "all" | "table";
type LegacyDumpBlock = Omit<DumpBlock, "type"> & {
  type: DumpBlock["type"] | "task";
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [brainDump, setBrainDump] = useState<DumpBlock[]>([]);
  const [big3, setBig3] = useState<string[]>(EMPTY_BIG3);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showPdfPopup, setShowPdfPopup] = useState(false);
  const [printTarget, setPrintTarget] = useState<PrintTarget | null>(null);

  const contentAllRef = useRef<HTMLDivElement>(null);
  const contentTableRef = useRef<HTMLDivElement>(null);

  const printAll = useReactToPrint({
    contentRef: contentAllRef,
    documentTitle: `${title || "PlannerBox"}_${format(new Date(), "yyyy-MM-dd")}`,
    pageStyle:
      "@page { size: A4 landscape; margin: 8mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }",
    onAfterPrint: () => {
      setPrintTarget(null);
    },
  });

  const printTable = useReactToPrint({
    contentRef: contentTableRef,
    documentTitle: `${title || "PlannerBox"}_table_${format(new Date(), "yyyy-MM-dd")}`,
    pageStyle:
      "@page { size: A4 landscape; margin: 8mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }",
    onAfterPrint: () => {
      setPrintTarget(null);
    },
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const currentWeekKey = getCurrentWeekKey();
      const lastWeekKey = localStorage.getItem("timebox-last-week-v2");

      const savedTasks = localStorage.getItem("timebox-tasks-v2");
      const savedTitle = localStorage.getItem("timebox-title-v2");
      const savedSubtitle = localStorage.getItem("timebox-subtitle-v2");
      const savedBrain = localStorage.getItem("timebox-brain-v2");
      const savedBig3 = localStorage.getItem("timebox-big3-v2");

      if (lastWeekKey && lastWeekKey !== currentWeekKey) {
        const archiveData: ArchiveEntry = {
          tasks: parseJSON<Task[]>(savedTasks, []),
          brainDump: normalizeDumpBlocks(parseJSON<LegacyDumpBlock[]>(savedBrain, [])),
          big3: parseJSON<string[]>(savedBig3, EMPTY_BIG3),
          title: savedTitle || "",
          subtitle: savedSubtitle || "",
        };

        const archives = parseJSON<Record<string, ArchiveEntry>>(localStorage.getItem("timebox-archives"), {});
        archives[lastWeekKey] = archiveData;
        localStorage.setItem("timebox-archives", JSON.stringify(archives));

        setTasks([]);
        setBrainDump([]);
        setBig3(EMPTY_BIG3);
        setSubtitle("·");
      } else {
        setTasks(normalizeTasks(parseJSON<Task[]>(savedTasks, [])));
        setBig3(parseJSON<string[]>(savedBig3, EMPTY_BIG3));
        setBrainDump(normalizeDumpBlocks(parseJSON<LegacyDumpBlock[]>(savedBrain, [])));
        setSubtitle(savedSubtitle || "·");
      }

      setTitle(savedTitle || getDefaultTitle());
      localStorage.setItem("timebox-last-week-v2", currentWeekKey);
      setIsLoaded(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    localStorage.setItem("timebox-tasks-v2", JSON.stringify(tasks));
    localStorage.setItem("timebox-title-v2", title);
    localStorage.setItem("timebox-subtitle-v2", subtitle);
    localStorage.setItem("timebox-brain-v2", JSON.stringify(brainDump));
    localStorage.setItem("timebox-big3-v2", JSON.stringify(big3));
  }, [tasks, title, subtitle, brainDump, big3, isLoaded]);

  const handleRestore = (archive: ArchiveEntry) => {
    if (!confirm("과거의 기록을 현재로 불러오시겠습니까? 현재 작성 중인 내용은 사라집니다.")) {
      return;
    }

    setTasks(normalizeTasks(archive.tasks || []));
    setBrainDump(normalizeDumpBlocks(archive.brainDump || []));
    setBig3(archive.big3 || EMPTY_BIG3);
    setTitle(archive.title || getDefaultTitle());
    setSubtitle(archive.subtitle || "·");
    setShowArchiveModal(false);
  };

  const handleExportPDF = (target: PrintTarget) => {
    setPrintTarget(target);
    setShowPdfPopup(false);

    setTimeout(() => {
      if (target === "all") {
        printAll();
      } else {
        printTable();
      }
    }, 240);
  };

  if (!isLoaded) return null;

  return (
    <>
      {showArchiveModal ? (
        <ArchiveModal onClose={() => setShowArchiveModal(false)} onRestore={handleRestore} />
      ) : null}

      <main
        ref={contentAllRef}
        id="pdf-content-all"
        className={`layout ${printTarget === "all" ? "print-prep print-prep-all" : ""}`}
      >
        <aside className="sidebar">
          <Header title={title} setTitle={setTitle} subtitle={subtitle} setSubtitle={setSubtitle} />
          <Sidebar
            brainDump={brainDump}
            setBrainDump={setBrainDump}
            big3={big3}
            setBig3={setBig3}
            onOpenArchive={() => setShowArchiveModal(true)}
            onOpenPdf={() => setShowPdfPopup(true)}
          />
        </aside>

        <div
          ref={contentTableRef}
          id="pdf-content-table"
          className={`office-table-wrap ${printTarget === "table" ? "print-prep print-prep-table" : ""}`}
        >
          <TimeBox tasks={tasks} setTasks={setTasks} printMode={printTarget} />
        </div>
      </main>

      {showPdfPopup ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-backdrop" onClick={() => setShowPdfPopup(false)} />
          <div className="modal-card pdf-card">
            <div className="modal-header">
              <h2>PDF 내보내기</h2>
              <button type="button" className="btn text" onClick={() => setShowPdfPopup(false)}>
                닫기
              </button>
            </div>

            <div className="modal-body pdf-options">
              <button type="button" className="btn outline" onClick={() => handleExportPDF("table")}>
                시간표만
              </button>
              <button type="button" className="btn filled" onClick={() => handleExportPDF("all")}>
                전체 화면
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function getDefaultTitle() {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekNum = getWeekOfMonth(weekStart);
  const weekText = ["첫", "둘", "셋", "넷", "다섯", "여섯"][weekNum - 1] || "첫";
  return `${format(weekStart, "yyMM")} ${weekText}째 주`;
}

function parseJSON<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalizeTasks(rawTasks: Task[]) {
  return rawTasks
    .map((task) => {
      const duration = Math.max(0.5, Math.round((task.duration || 1) * 4) / 4);
      const start = Math.round((task.startTime || 9) * 4) / 4;
      const maxStart = 19 - duration;
      const startTime = Math.max(9, Math.min(maxStart, start));

      return {
        ...task,
        description: typeof task.description === "string" ? task.description : "",
        dayOfWeek: Math.max(0, Math.min(4, Math.round(task.dayOfWeek || 0))),
        startTime,
        duration,
      };
    })
    .filter((task) => task.startTime >= 9 && task.startTime + task.duration <= 19);
}

function normalizeDumpBlocks(rawBlocks: LegacyDumpBlock[]) {
  return rawBlocks.map((block) => ({
    ...block,
    type: block.type === "task" ? "checkbox" : block.type,
    content: typeof block.content === "string" ? block.content : "",
    depth: Number.isFinite(block.depth) ? Math.max(0, Math.min(2, block.depth)) : 0,
    checked: Boolean(block.checked),
  })) as DumpBlock[];
}
