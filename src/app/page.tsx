"use client";

import React, { useEffect, useRef, useState } from "react";
import { format, getWeekOfMonth, startOfWeek } from "date-fns";
import { useReactToPrint } from "react-to-print";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { TimeBox } from "@/components/TimeBox";
import { ArchiveModal } from "@/components/ArchiveModal";
import { DumpBlock } from "@/components/BrainDumpEditor";
import { Task, Consultant } from "@/lib/types";
import { getCurrentWeekKey, getDefaultTitleFromWeekKey } from "@/lib/dateUtils";

interface ArchiveEntry {
  tasks: Task[];
  brainDump: DumpBlock[];
  big3: string[];
  title: string;
  subtitle: string;
  consultants?: Consultant[];
  poppedMissedTitles?: string[]; // legacy fallback
  poppedMissedIds?: string[];
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
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [poppedMissedIds, setPoppedMissedIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showPdfPopup, setShowPdfPopup] = useState(false);
  const [printTarget, setPrintTarget] = useState<PrintTarget | null>(null);
  const [viewingArchiveKey, setViewingArchiveKey] = useState<string | null>(null);

  // Sketchbook Mode States
  const [isSketchbookOpen, setIsSketchbookOpen] = useState(false);
  const [sketchbookTasks, setSketchbookTasks] = useState<Task[]>([]);
  const [sketchbookTitle, setSketchbookTitle] = useState("임시 스케치북");
  const [sketchbookSubtitle, setSketchbookSubtitle] = useState("프린트용 임시 편집 모드");
  const [sketchbookBrainDump, setSketchbookBrainDump] = useState<DumpBlock[]>([]);
  const [sketchbookBig3, setSketchbookBig3] = useState<string[]>(EMPTY_BIG3);
  const [sketchbookConsultants, setSketchbookConsultants] = useState<Consultant[]>([]);
  const [sketchbookPoppedMissedIds, setSketchbookPoppedMissedIds] = useState<string[]>([]);
  const [sketchbookPrintTarget, setSketchbookPrintTarget] = useState<PrintTarget | null>(null);
  const [showSketchbookPdfPopup, setShowSketchbookPdfPopup] = useState(false);
  const [sketchbookArchiveKey, setSketchbookArchiveKey] = useState<string | null>(null);
  const [showSketchbookArchiveModal, setShowSketchbookArchiveModal] = useState(false);

  const contentAllRef = useRef<HTMLDivElement>(null);
  const contentTableRef = useRef<HTMLDivElement>(null);
  const sketchbookContentAllRef = useRef<HTMLDivElement>(null);
  const sketchbookContentTableRef = useRef<HTMLDivElement>(null);

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

  const printSketchbookAll = useReactToPrint({
    contentRef: sketchbookContentAllRef,
    documentTitle: `${sketchbookTitle || "Sketchbook"}_${format(new Date(), "yyyy-MM-dd")}`,
    pageStyle:
      "@page { size: A4 landscape; margin: 8mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }",
    onAfterPrint: () => {
      setSketchbookPrintTarget(null);
    },
  });

  const printSketchbookTable = useReactToPrint({
    contentRef: sketchbookContentTableRef,
    documentTitle: `${sketchbookTitle || "Sketchbook"}_table_${format(new Date(), "yyyy-MM-dd")}`,
    pageStyle:
      "@page { size: A4 landscape; margin: 8mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }",
    onAfterPrint: () => {
      setSketchbookPrintTarget(null);
    },
  });

  // Load Initial Data
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const currentWeekKey = getCurrentWeekKey();
      const lastWeekKey = localStorage.getItem("timebox-last-week-v2");

      const savedTasks = localStorage.getItem("timebox-tasks-v2");
      const savedTitle = localStorage.getItem("timebox-title-v2");
      const savedSubtitle = localStorage.getItem("timebox-subtitle-v2");
      const savedBrain = localStorage.getItem("timebox-brain-v2");
      const savedBig3 = localStorage.getItem("timebox-big3-v2");
      const savedConsultants = localStorage.getItem("timebox-consultants-v2");
      const savedPoppedMissed = localStorage.getItem("timebox-popped-missed-ids-v2") || localStorage.getItem("timebox-popped-missed-v2"); // check both new and legacy

      if (lastWeekKey && lastWeekKey !== currentWeekKey) {
        // Archive the completed week
        const archiveData: ArchiveEntry = {
          tasks: parseJSON<Task[]>(savedTasks, []),
          brainDump: normalizeDumpBlocks(parseJSON<LegacyDumpBlock[]>(savedBrain, [])),
          big3: parseJSON<string[]>(savedBig3, EMPTY_BIG3),
          title: savedTitle || "",
          subtitle: savedSubtitle || "",
          consultants: parseJSON<Consultant[]>(savedConsultants, []),
          poppedMissedIds: parseJSON<string[]>(savedPoppedMissed, []),
        };

        const archives = parseJSON<Record<string, ArchiveEntry>>(localStorage.getItem("timebox-archives"), {});
        archives[lastWeekKey] = archiveData;
        localStorage.setItem("timebox-archives", JSON.stringify(archives));

        // Reset for the new week
        setTasks([]);
        setBrainDump([]);
        setBig3(EMPTY_BIG3);
        setConsultants([]);
        setPoppedMissedIds([]);
        setSubtitle("·");
      } else {
        // Load current week data
        setTasks(normalizeTasks(parseJSON<Task[]>(savedTasks, [])));
        setBig3(parseJSON<string[]>(savedBig3, EMPTY_BIG3));
        setBrainDump(normalizeDumpBlocks(parseJSON<LegacyDumpBlock[]>(savedBrain, [])));
        setConsultants(parseJSON<Consultant[]>(savedConsultants, []));
        setPoppedMissedIds(parseJSON<string[]>(savedPoppedMissed, []));
        setSubtitle(savedSubtitle || "·");
      }

      setTitle(savedTitle || getDefaultTitle());
      localStorage.setItem("timebox-last-week-v2", currentWeekKey);
      setIsLoaded(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  // Handle Archive Viewing vs Current Week
  useEffect(() => {
    if (!isLoaded) return;

    if (viewingArchiveKey === null) {
      const savedTasks = localStorage.getItem("timebox-tasks-v2");
      const savedTitle = localStorage.getItem("timebox-title-v2");
      const savedSubtitle = localStorage.getItem("timebox-subtitle-v2");
      const savedBrain = localStorage.getItem("timebox-brain-v2");
      const savedBig3 = localStorage.getItem("timebox-big3-v2");
      const savedConsultants = localStorage.getItem("timebox-consultants-v2");
      const savedPoppedMissed = localStorage.getItem("timebox-popped-missed-ids-v2") || localStorage.getItem("timebox-popped-missed-v2");

      setTasks(normalizeTasks(parseJSON<Task[]>(savedTasks, [])));
      setBig3(parseJSON<string[]>(savedBig3, EMPTY_BIG3));
      setBrainDump(normalizeDumpBlocks(parseJSON<LegacyDumpBlock[]>(savedBrain, [])));
      setConsultants(parseJSON<Consultant[]>(savedConsultants, []));
      setPoppedMissedIds(parseJSON<string[]>(savedPoppedMissed, []));
      setSubtitle(savedSubtitle || "·");
      setTitle(savedTitle || getDefaultTitle());
    } else {
      const archives = parseJSON<Record<string, ArchiveEntry>>(localStorage.getItem("timebox-archives"), {});
      const archive = archives[viewingArchiveKey];
      if (archive) {
        setTasks(normalizeTasks(archive.tasks || []));
        setBrainDump(normalizeDumpBlocks(archive.brainDump || []));
        setBig3(archive.big3 || EMPTY_BIG3);
        setConsultants(archive.consultants || []);
        setPoppedMissedIds(archive.poppedMissedIds || archive.poppedMissedTitles || []);
        setTitle(archive.title || getDefaultTitleFromWeekKey(viewingArchiveKey));
        setSubtitle(archive.subtitle || "·");
      }
    }
  }, [viewingArchiveKey, isLoaded]);

  // Sync Current Week Data to LocalStorage
  useEffect(() => {
    if (!isLoaded) return;

    if (viewingArchiveKey === null) {
      localStorage.setItem("timebox-tasks-v2", JSON.stringify(tasks));
      localStorage.setItem("timebox-title-v2", title);
      localStorage.setItem("timebox-subtitle-v2", subtitle);
      localStorage.setItem("timebox-brain-v2", JSON.stringify(brainDump));
      localStorage.setItem("timebox-big3-v2", JSON.stringify(big3));
      localStorage.setItem("timebox-consultants-v2", JSON.stringify(consultants));
      localStorage.setItem("timebox-popped-missed-ids-v2", JSON.stringify(poppedMissedIds));
    } else {
      const archives = parseJSON<Record<string, ArchiveEntry>>(localStorage.getItem("timebox-archives"), {});
      if (archives[viewingArchiveKey]) {
        archives[viewingArchiveKey] = {
          ...archives[viewingArchiveKey],
          tasks,
          title,
          subtitle,
          brainDump,
          big3,
          consultants,
          poppedMissedIds,
        };
        localStorage.setItem("timebox-archives", JSON.stringify(archives));
      }
    }
  }, [tasks, title, subtitle, brainDump, big3, consultants, poppedMissedIds, isLoaded, viewingArchiveKey]);

  // Sketchbook State Auto-save to session storage (for robustness)
  useEffect(() => {
    if (!isLoaded || !isSketchbookOpen) return;
    sessionStorage.setItem("sketchbook-tasks", JSON.stringify(sketchbookTasks));
    sessionStorage.setItem("sketchbook-title", sketchbookTitle);
    sessionStorage.setItem("sketchbook-subtitle", sketchbookSubtitle);
    sessionStorage.setItem("sketchbook-brain", JSON.stringify(sketchbookBrainDump));
    sessionStorage.setItem("sketchbook-big3", JSON.stringify(sketchbookBig3));
    sessionStorage.setItem("sketchbook-consultants", JSON.stringify(sketchbookConsultants));
    sessionStorage.setItem("sketchbook-popped-missed-ids", JSON.stringify(sketchbookPoppedMissedIds));
  }, [sketchbookTasks, sketchbookTitle, sketchbookSubtitle, sketchbookBrainDump, sketchbookBig3, sketchbookConsultants, sketchbookPoppedMissedIds, isLoaded, isSketchbookOpen]);

  const handleRestore = (key: string) => {
    setViewingArchiveKey(key);
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

  const handleExportSketchbookPDF = (target: PrintTarget) => {
    setSketchbookPrintTarget(target);
    setShowSketchbookPdfPopup(false);

    setTimeout(() => {
      if (target === "all") {
        printSketchbookAll();
      } else {
        printSketchbookTable();
      }
    }, 240);
  };

  // Find a free slot in the scheduler helper
  const findFreeSlot = (duration: number, existingTasks: Task[]): { dayOfWeek: number; startTime: number } | null => {
    // Try Monday to Friday (0 to 4)
    for (let day = 0; day < 5; day++) {
      // Check times from 9:00 to 19:00 with 15 mins (0.25h) granularity
      for (let time = 9.0; time <= 19.0 - duration; time += 0.25) {
        const hasCollision = existingTasks.some((t) => {
          if (t.dayOfWeek !== day) return false;
          const tEnd = t.startTime + t.duration;
          const end = time + duration;
          return time < tEnd && end > t.startTime;
        });
        if (!hasCollision) {
          return { dayOfWeek: day, startTime: time };
        }
      }
    }
    return null;
  };

  // Pop missed task implementation (pop by ID)
  const handlePopMissedTask = (taskToPop: Task) => {
    const duration = taskToPop.duration || 1;
    const freeSlot = findFreeSlot(duration, tasks);
    if (!freeSlot) {
      alert("시간표에 빈 자리가 없습니다!");
      return;
    }

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: taskToPop.title,
      description: taskToPop.description || "",
      dayOfWeek: freeSlot.dayOfWeek,
      startTime: freeSlot.startTime,
      duration: duration,
      color: taskToPop.color || "neutral",
      isMissed: false,
    };

    setTasks((prev) => [...prev, newTask]);
    setPoppedMissedIds((prev) => {
      const id = taskToPop.id;
      return prev.includes(id) ? prev : [...prev, id];
    });
  };

  const handlePopSketchbookMissedTask = (taskToPop: Task) => {
    const duration = taskToPop.duration || 1;
    const freeSlot = findFreeSlot(duration, sketchbookTasks);
    if (!freeSlot) {
      alert("시간표에 빈 자리가 없습니다!");
      return;
    }

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: taskToPop.title,
      description: taskToPop.description || "",
      dayOfWeek: freeSlot.dayOfWeek,
      startTime: freeSlot.startTime,
      duration: duration,
      color: taskToPop.color || "neutral",
      isMissed: false,
    };

    setSketchbookTasks((prev) => [...prev, newTask]);
    setSketchbookPoppedMissedIds((prev) => {
      const id = taskToPop.id;
      return prev.includes(id) ? prev : [...prev, id];
    });
  };

  // Sketchbook Operations
  const handleOpenSketchbook = () => {
    // Load last session sketchbook data if exists, otherwise load current active plan as template
    const sessTasks = sessionStorage.getItem("sketchbook-tasks");
    const sessTitle = sessionStorage.getItem("sketchbook-title");
    const sessSubtitle = sessionStorage.getItem("sketchbook-subtitle");
    const sessBrain = sessionStorage.getItem("sketchbook-brain");
    const sessBig3 = sessionStorage.getItem("sketchbook-big3");
    const sessConsultants = sessionStorage.getItem("sketchbook-consultants");
    const sessPoppedMissed = sessionStorage.getItem("sketchbook-popped-missed-ids");

    if (sessTasks) {
      setSketchbookTasks(parseJSON<Task[]>(sessTasks, []));
      setSketchbookTitle(sessTitle || "임시 스케치북");
      setSketchbookSubtitle(sessSubtitle || "프린트용 임시 편집 모드");
      setSketchbookBrainDump(parseJSON<DumpBlock[]>(sessBrain, []));
      setSketchbookBig3(parseJSON<string[]>(sessBig3, EMPTY_BIG3));
      setSketchbookConsultants(parseJSON<Consultant[]>(sessConsultants, []));
      setSketchbookPoppedMissedIds(parseJSON<string[]>(sessPoppedMissed, []));
    } else {
      // Use current plan as base
      setSketchbookTasks(JSON.parse(JSON.stringify(tasks)));
      setSketchbookTitle("임시 스케치북");
      setSketchbookSubtitle("프린트용 임시 편집 모드");
      setSketchbookBrainDump(JSON.parse(JSON.stringify(brainDump)));
      setSketchbookBig3(JSON.parse(JSON.stringify(big3)));
      setSketchbookConsultants(JSON.parse(JSON.stringify(consultants)));
      setSketchbookPoppedMissedIds(JSON.parse(JSON.stringify(poppedMissedIds)));
    }
    setIsSketchbookOpen(true);
  };

  const handleLoadCurrentToSketchbook = () => {
    if (confirm("현재 주간 계획을 불러오시겠습니까? 스케치북에 작성 중이던 임시 편집 내용은 덮어써집니다.")) {
      setSketchbookTasks(JSON.parse(JSON.stringify(tasks)));
      setSketchbookTitle("임시 스케치북");
      setSketchbookSubtitle("프린트용 임시 편집 모드");
      setSketchbookBrainDump(JSON.parse(JSON.stringify(brainDump)));
      setSketchbookBig3(JSON.parse(JSON.stringify(big3)));
      setSketchbookConsultants(JSON.parse(JSON.stringify(consultants)));
      setSketchbookPoppedMissedIds(JSON.parse(JSON.stringify(poppedMissedIds)));
    }
  };

  const handleSaveSketchbookToArchive = () => {
    const key = `sketchbook-${format(new Date(), "yyyyMMdd-HHmmss")}`;
    const archiveData: ArchiveEntry = {
      tasks: sketchbookTasks,
      brainDump: sketchbookBrainDump,
      big3: sketchbookBig3,
      title: sketchbookTitle,
      subtitle: sketchbookSubtitle,
      consultants: sketchbookConsultants,
      poppedMissedIds: sketchbookPoppedMissedIds,
    };

    const archives = parseJSON<Record<string, ArchiveEntry>>(localStorage.getItem("timebox-archives"), {});
    archives[key] = archiveData;
    localStorage.setItem("timebox-archives", JSON.stringify(archives));
    alert(`보관함에 성공적으로 아카이브되었습니다!\n(키: ${key})`);
  };

  const handleSketchbookRestore = (key: string) => {
    const archives = parseJSON<Record<string, ArchiveEntry>>(localStorage.getItem("timebox-archives"), {});
    const archive = archives[key];
    if (archive) {
      setSketchbookTasks(normalizeTasks(archive.tasks || []));
      setSketchbookBrainDump(normalizeDumpBlocks(archive.brainDump || []));
      setSketchbookBig3(archive.big3 || EMPTY_BIG3);
      setSketchbookConsultants(archive.consultants || []);
      setSketchbookPoppedMissedIds(archive.poppedMissedIds || archive.poppedMissedTitles || []);
      setSketchbookTitle(archive.title || "임시 스케치북");
      setSketchbookSubtitle(archive.subtitle || "보관기록 불러옴");
      setSketchbookArchiveKey(key);
    }
    setShowSketchbookArchiveModal(false);
  };

  if (!isLoaded) return null;

  return (
    <>
      {showArchiveModal ? (
        <ArchiveModal
          onClose={() => setShowArchiveModal(false)}
          onRestore={handleRestore}
          onDeleteArchive={(key) => {
            if (viewingArchiveKey === key) {
              setViewingArchiveKey(null);
            }
          }}
          viewingArchiveKey={viewingArchiveKey}
        />
      ) : null}

      {viewingArchiveKey && (
        <div className="archive-view-banner" style={{
          backgroundColor: '#fffbeb',
          borderBottom: '1px solid #fef3c7',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#b45309',
          fontSize: '13px',
          fontWeight: 600,
          fontFamily: 'inherit'
        }}>
          <div>
            ⚠️ 이전 기록({getDefaultTitleFromWeekKey(viewingArchiveKey)})을 조회하고 있습니다. 현재 주 플랜은 보존되며 수정사항은 이 보관 기록에 자동 저장됩니다.
          </div>
          <button type="button" className="btn outline sm" onClick={() => setViewingArchiveKey(null)} style={{
            backgroundColor: '#ffffff',
            borderColor: '#f59e0b',
            color: '#b45309',
            cursor: 'pointer'
          }}>
            현재 주로 돌아가기
          </button>
        </div>
      )}

      {/* Main Work Mode */}
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
            viewingArchiveKey={viewingArchiveKey}
            onReturnToCurrent={() => setViewingArchiveKey(null)}
            consultants={consultants}
            setConsultants={setConsultants}
            poppedMissedIds={poppedMissedIds}
            tasks={tasks}
            onPopMissedTask={handlePopMissedTask}
            onOpenSketchbook={handleOpenSketchbook}
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
              <h2>🖨️ PDF 내보내기</h2>
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

      {/* Sketchbook Mode Popup Modal */}
      {isSketchbookOpen && (
        <div className="sketchbook-modal-overlay" role="dialog" aria-modal="true" style={{
          position: "fixed",
          inset: 0,
          zIndex: 900,
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          <div className="sketchbook-modal-card" style={{
            width: "98vw",
            height: "95vh",
            backgroundColor: "var(--bg)",
            borderRadius: "12px",
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.2)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: "1px solid var(--border-mid)"
          }}>
            {/* Sketchbook Header Action Bar */}
            <div className="sketchbook-bar" style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 24px",
              backgroundColor: "#f1f5f9",
              borderBottom: "1px solid #cbd5e1"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "16px", fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
                  🎨 임시 스케치북 모드 (인쇄 전용)
                </span>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  * 이 모드에서의 변경은 현재 주 스케줄에 영향을 주지 않는 독립된 샌드박스입니다.
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" className="btn outline sm" onClick={handleLoadCurrentToSketchbook} style={{ backgroundColor: "#ffffff" }}>
                  📥 현재 계획 가져오기
                </button>
                <button type="button" className="btn outline sm" onClick={() => setShowSketchbookArchiveModal(true)} style={{ backgroundColor: "#ffffff" }}>
                  🗄️ 기록 불러오기
                </button>
                <button type="button" className="btn outline sm" onClick={handleSaveSketchbookToArchive} style={{ backgroundColor: "#ffffff" }}>
                  💾 보관함에 임시저장
                </button>
                <button type="button" className="btn filled sm" onClick={() => setShowSketchbookPdfPopup(true)} style={{ backgroundColor: "#2563eb", borderColor: "#2563eb", color: "#ffffff" }}>
                  🖨️ 인쇄 / PDF
                </button>
                <button type="button" className="btn outline sm danger" onClick={() => setIsSketchbookOpen(false)} style={{ backgroundColor: "#ffffff", color: "#dc2626", borderColor: "#fca5a5" }}>
                  닫기 (종료)
                </button>
              </div>
            </div>

            {/* Inner Content Area */}
            <div className="sketchbook-editor-container" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>
              <main
                ref={sketchbookContentAllRef}
                id="pdf-sketchbook-all"
                className={`layout ${sketchbookPrintTarget === "all" ? "print-prep print-prep-all" : ""}`}
                style={{ height: "100%", width: "100%", maxWidth: "100%", display: "flex" }}
              >
                <aside className="sidebar" style={{ borderRight: "1px solid var(--border)", height: "100%", overflowY: "auto" }}>
                  <Header title={sketchbookTitle} setTitle={setSketchbookTitle} subtitle={sketchbookSubtitle} setSubtitle={setSketchbookSubtitle} />
                  <Sidebar
                    brainDump={sketchbookBrainDump}
                    setBrainDump={setSketchbookBrainDump}
                    big3={sketchbookBig3}
                    setBig3={setSketchbookBig3}
                    onOpenArchive={() => setShowSketchbookArchiveModal(true)}
                    onOpenPdf={() => setShowSketchbookPdfPopup(true)}
                    viewingArchiveKey={sketchbookArchiveKey}
                    onReturnToCurrent={() => setSketchbookArchiveKey(null)}
                    consultants={sketchbookConsultants}
                    setConsultants={setSketchbookConsultants}
                    poppedMissedIds={sketchbookPoppedMissedIds}
                    tasks={sketchbookTasks}
                    onPopMissedTask={handlePopSketchbookMissedTask}
                  />
                </aside>

                <div
                  ref={sketchbookContentTableRef}
                  id="pdf-sketchbook-table"
                  className={`office-table-wrap ${sketchbookPrintTarget === "table" ? "print-prep print-prep-table" : ""}`}
                  style={{ flex: 1, height: "100%", overflowY: "auto" }}
                >
                  <TimeBox tasks={sketchbookTasks} setTasks={setSketchbookTasks} printMode={sketchbookPrintTarget} />
                </div>
              </main>
            </div>
          </div>
        </div>
      )}

      {/* Sketchbook PDF Selector */}
      {showSketchbookPdfPopup ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" style={{ zIndex: 1000 }}>
          <div className="modal-backdrop" onClick={() => setShowSketchbookPdfPopup(false)} />
          <div className="modal-card pdf-card">
            <div className="modal-header">
              <h2>🖨️ 스케치북 PDF 내보내기</h2>
              <button type="button" className="btn text" onClick={() => setShowSketchbookPdfPopup(false)}>
                닫기
              </button>
            </div>

            <div className="modal-body pdf-options">
              <button type="button" className="btn outline" onClick={() => handleExportSketchbookPDF("table")}>
                시간표만
              </button>
              <button type="button" className="btn filled" onClick={() => handleExportSketchbookPDF("all")}>
                전체 화면
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Sketchbook Load Archive Modal */}
      {showSketchbookArchiveModal ? (
        <div style={{ zIndex: 1000, position: "relative" }}>
          <ArchiveModal
            onClose={() => setShowSketchbookArchiveModal(false)}
            onRestore={handleSketchbookRestore}
            viewingArchiveKey={sketchbookArchiveKey}
          />
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
