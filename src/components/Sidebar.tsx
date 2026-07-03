"use client";

import React, { useState, useMemo } from "react";
import { BrainDumpEditor, DumpBlock } from "@/components/BrainDumpEditor";
import { Task, Consultant } from "@/lib/types";
import { Plus, Trash2, ArrowRight, ChevronDown, ChevronUp, Palette } from "lucide-react";

interface SidebarProps {
  brainDump: DumpBlock[];
  setBrainDump: (val: DumpBlock[]) => void;
  big3: string[];
  setBig3: (val: string[]) => void;
  onOpenArchive: () => void;
  onOpenPdf: () => void;
  viewingArchiveKey: string | null;
  onReturnToCurrent: () => void;
  consultants: Consultant[];
  setConsultants: (val: Consultant[]) => void;
  poppedMissedIds: string[];
  tasks: Task[];
  onPopMissedTask: (task: Task) => void;
  onOpenSketchbook?: () => void;
}

const BIG3_PLACEHOLDERS = [
  "최우선 과제",
  "주요 완료 과제",
  "추가 집중 과제",
];

const POST_IT_COLORS = [
  { bg: "rgba(255, 93, 93, 0.22)", border: "rgba(184, 32, 45, 0.5)", text: "#2b1111" },
  { bg: "rgba(255, 209, 75, 0.28)", border: "rgba(184, 124, 7, 0.5)", text: "#2d2207" },
  { bg: "rgba(86, 234, 160, 0.22)", border: "rgba(19, 138, 84, 0.5)", text: "#0d2e20" },
  { bg: "rgba(78, 162, 255, 0.22)", border: "rgba(26, 89, 180, 0.5)", text: "#10203d" },
  { bg: "rgba(244, 114, 208, 0.22)", border: "rgba(219, 39, 119, 0.5)", text: "#4c0519" },
];

export const Sidebar: React.FC<SidebarProps> = ({
  brainDump,
  setBrainDump,
  big3,
  setBig3,
  onOpenArchive,
  onOpenPdf,
  viewingArchiveKey,
  onReturnToCurrent,
  consultants = [],
  setConsultants,
  poppedMissedIds = [],
  tasks = [],
  onPopMissedTask,
  onOpenSketchbook,
}) => {
  const [isMissedListOpen, setIsMissedListOpen] = useState(true);

  // Dynamic goals handlers
  const handleBig3Change = (index: number, value: string) => {
    const next = [...big3];
    next[index] = value;
    setBig3(next);
  };

  const handleAddGoal = () => {
    setBig3([...big3, ""]);
  };

  const handleDeleteGoal = (index: number) => {
    const next = big3.filter((_, i) => i !== index);
    setBig3(next.length === 0 ? [""] : next);
  };

  // Consultants handlers
  const handleAddConsultant = () => {
    const newConsultant: Consultant = {
      id: crypto.randomUUID(),
      name: "",
      colorIndex: 0,
    };
    setConsultants([...consultants, newConsultant]);
  };

  const handleConsultantChange = (id: string, name: string) => {
    setConsultants(consultants.map(c => c.id === id ? { ...c, name } : c));
  };

  const handleConsultantColorCycle = (id: string) => {
    setConsultants(consultants.map(c => c.id === id ? { ...c, colorIndex: (c.colorIndex + 1) % POST_IT_COLORS.length } : c));
  };

  const handleDeleteConsultant = (id: string) => {
    setConsultants(consultants.filter(c => c.id !== id));
  };

  // Filter & deduplicate missed tasks
  const missedTasks = useMemo(() => {
    const unique: Task[] = [];
    const seen = new Set<string>();
    tasks.forEach((t) => {
      if (t.isMissed && t.title && t.title.trim() !== "" && !poppedMissedIds.includes(t.id)) {
        const titleTrimmed = t.title.trim();
        if (!seen.has(titleTrimmed)) {
          seen.add(titleTrimmed);
          unique.push(t);
        }
      }
    });
    return unique;
  }, [tasks, poppedMissedIds]);

  return (
    <>
      {/* Weekly Goals */}
      <section className="section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", borderBottom: "1px solid var(--border)", paddingBottom: "4px" }}>
          <h2 className="sec-title" style={{ borderBottom: "none", marginBottom: 0, paddingBottom: 0 }}>주간 목표</h2>
          <button type="button" className="sidebar-action-btn" onClick={handleAddGoal} title="목표 추가">
            <Plus size={14} />
          </button>
        </div>
        <ol className="goal-list">
          {big3.map((goal, i) => (
            <li key={i} className="goal-item-row" style={{ display: "flex", alignItems: "center", width: "100%" }}>
              <span className="goal-num" style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-3)", width: "14px" }}>{i + 1}.</span>
              <input
                type="text"
                value={goal || ""}
                onChange={(e) => handleBig3Change(i, e.target.value)}
                placeholder={BIG3_PLACEHOLDERS[i] || "추가 목표"}
                className="goal-input"
                style={{ flex: 1 }}
              />
              <button type="button" className="goal-delete-btn" onClick={() => handleDeleteGoal(i)} title="목표 삭제">
                <Trash2 size={11} />
              </button>
            </li>
          ))}
        </ol>
      </section>

      {/* Brain Dump Memo */}
      <section className="section dump-section">
        <h2 className="sec-title memo-title">메모</h2>
        <BrainDumpEditor blocks={brainDump} onChange={setBrainDump} />
      </section>

      {/* Weekly Consultations List */}
      <section className="section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", borderBottom: "1px solid var(--border)", paddingBottom: "4px" }}>
          <h2 className="sec-title" style={{ borderBottom: "none", marginBottom: 0, paddingBottom: 0 }}>이번 주 상담자 리스트</h2>
          <button type="button" className="sidebar-action-btn" onClick={handleAddConsultant} title="상담자 추가">
            <Plus size={14} />
          </button>
        </div>
        <div className="consultant-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px", maxHeight: "150px", overflowY: "auto", paddingRight: "2px" }}>
          {consultants.length === 0 ? (
            <div style={{ gridColumn: "span 2", fontSize: "11px", color: "var(--text-3)", textAlign: "center", padding: "8px 0" }}>
              등록된 상담자가 없습니다.
            </div>
          ) : (
            consultants.map((c) => {
              const color = POST_IT_COLORS[c.colorIndex] || POST_IT_COLORS[0];
              return (
                <div
                  key={c.id}
                  className="consultant-card"
                  style={{
                    backgroundColor: color.bg,
                    border: `1px solid ${color.border}`,
                    color: color.text,
                    borderRadius: "6px",
                    padding: "4px 6px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    minWidth: 0,
                    transition: "all 0.15s ease",
                  }}
                >
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => handleConsultantChange(c.id, e.target.value)}
                    placeholder="이름"
                    style={{
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      color: "inherit",
                      fontSize: "12px",
                      fontWeight: 600,
                      width: "100%",
                      minWidth: 0,
                      padding: 0,
                    }}
                  />
                  <div className="consultant-actions" style={{ display: "flex", alignItems: "center", gap: "2px", marginLeft: "auto" }}>
                    <button
                      type="button"
                      onClick={() => handleConsultantColorCycle(c.id)}
                      title="색상 변경"
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        color: "inherit",
                        opacity: 0.6,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Palette size={10} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteConsultant(c.id)}
                      title="삭제"
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        color: "inherit",
                        opacity: 0.6,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Missed Tasks Toggle List */}
      <section className="section">
        <button
          type="button"
          onClick={() => setIsMissedListOpen(!isMissedListOpen)}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            background: "none",
            border: "none",
            borderBottom: "1px solid var(--border)",
            paddingBottom: "4px",
            marginBottom: "8px",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <span className="sec-title" style={{ borderBottom: "none", marginBottom: 0, paddingBottom: 0 }}>
            미수행 태스크 ({missedTasks.length})
          </span>
          {isMissedListOpen ? <ChevronUp size={14} className="text-2" /> : <ChevronDown size={14} className="text-2" />}
        </button>
        {isMissedListOpen && (
          <div className="missed-tasks-list" style={{ maxHeight: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
            {missedTasks.length === 0 ? (
              <div style={{ fontSize: "11px", color: "var(--text-3)", textAlign: "center", padding: "8px 0" }}>
                미수행 태스크가 없습니다.
              </div>
            ) : (
              missedTasks.map((t) => (
                <div
                  key={t.id}
                  className="missed-task-item"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 8px",
                    backgroundColor: "#ffffff",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                >
                  <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: "8px" }}>
                    {t.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => onPopMissedTask(t)}
                    title="일정에 추가 및 리스트에서 제거 (pop)"
                    style={{
                      background: "var(--border)",
                      border: "none",
                      cursor: "pointer",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      color: "var(--text)",
                      display: "flex",
                      alignItems: "center",
                      gap: "2px",
                      fontSize: "10px",
                      fontWeight: 600,
                    }}
                  >
                    이동 <ArrowRight size={10} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* Sidebar Footer */}
      <div className="sidebar-footer" style={{ display: "flex", gap: "6px", marginTop: "auto", paddingTop: "12px" }}>
        {viewingArchiveKey && (
          <button
            type="button"
            className="btn outline sm"
            onClick={onReturnToCurrent}
            style={{
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: '#fffbeb',
              borderColor: '#fef3c7',
              color: '#b45309',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
            }}
            title="현재 주로 돌아가기"
          >
            🏠 현재 주
          </button>
        )}

        {onOpenSketchbook && (
          <button
            type="button"
            className="btn outline sm"
            onClick={onOpenSketchbook}
            style={{
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              marginRight: "auto"
            }}
            title="🎨 스케치북 모드"
          >
            🎨 스케치북
          </button>
        )}

        <button type="button" className="btn outline sm" onClick={onOpenArchive} style={{ fontSize: '1.16rem' }} title="보관함">
          🗄️
        </button>
        <button type="button" className="btn filled sm" onClick={onOpenPdf} style={{ fontSize: '1.16rem' }} title="인쇄 / PDF">
          🖨️
        </button>
      </div>
    </>
  );
};
