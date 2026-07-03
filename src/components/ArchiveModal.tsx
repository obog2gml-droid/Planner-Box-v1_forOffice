"use client";

import React, { useMemo, useState } from "react";
import { DumpBlock } from "@/components/BrainDumpEditor";
import { Task } from "@/lib/types";
import { getDefaultTitleFromWeekKey, getMonthLabelFromWeekKey } from "@/lib/dateUtils";

interface ArchiveEntry {
  tasks: Task[];
  brainDump: DumpBlock[];
  big3: string[];
  title: string;
  subtitle: string;
}

interface ArchiveModalProps {
  onClose: () => void;
  onRestore: (key: string) => void;
  onDeleteArchive?: (key: string) => void;
  viewingArchiveKey?: string | null;
}

export const ArchiveModal: React.FC<ArchiveModalProps> = ({
  onClose,
  onRestore,
  onDeleteArchive,
  viewingArchiveKey,
}) => {
  const [archives, setArchives] = useState<Record<string, ArchiveEntry>>(() => {
    if (typeof window === "undefined") return {};
    const raw = window.localStorage.getItem("timebox-archives");
    if (!raw) return {};

    try {
      return JSON.parse(raw) as Record<string, ArchiveEntry>;
    } catch {
      return {};
    }
  });

  const [searchQuery, setSearchQuery] = useState("");

  const archiveKeys = useMemo(() => Object.keys(archives).sort().reverse(), [archives]);

  // Full-text filtering across Title, Subtitle, Big 3, Tasks, and Brain Dump
  const filteredKeys = useMemo(() => {
    return archiveKeys.filter((key) => {
      const archive = archives[key];
      if (!archive) return false;
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      const titleMatch = (archive.title || getDefaultTitleFromWeekKey(key))
        .toLowerCase()
        .includes(query);
      const subtitleMatch = archive.subtitle?.toLowerCase().includes(query);
      const big3Match = archive.big3?.some((item: string) =>
        item?.toLowerCase().includes(query)
      );
      const tasksMatch = archive.tasks?.some(
        (task: any) =>
          task.title?.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query)
      );
      const brainDumpMatch = archive.brainDump?.some((block: any) =>
        block.content?.toLowerCase().includes(query)
      );

      return titleMatch || subtitleMatch || big3Match || tasksMatch || brainDumpMatch;
    });
  }, [archiveKeys, archives, searchQuery]);

  // Group filtered keys by Month
  const groupedKeys = useMemo(() => {
    const groups: Record<string, string[]> = {};
    filteredKeys.forEach((key) => {
      const monthLabel = getMonthLabelFromWeekKey(key);
      if (!groups[monthLabel]) {
        groups[monthLabel] = [];
      }
      groups[monthLabel].push(key);
    });
    return groups;
  }, [filteredKeys]);

  const sortedMonths = useMemo(() => Object.keys(groupedKeys).sort().reverse(), [groupedKeys]);

  const removeArchive = (key: string) => {
    if (confirm("정말 이 보관 기록을 삭제하시겠습니까?")) {
      const next = { ...archives };
      delete next[key];
      setArchives(next);
      localStorage.setItem("timebox-archives", JSON.stringify(next));
      if (onDeleteArchive) {
        onDeleteArchive(key);
      }
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-backdrop" onClick={onClose} />

      <div className="modal-card" style={{ width: "min(680px, 100%)", maxHeight: "85vh" }}>
        <div className="modal-header">
          <div>
            <h2>기록 보관함</h2>
            <p style={{ fontSize: "11px", color: "var(--text-3)", marginTop: "2px" }}>Archived Constellations</p>
          </div>
          <button type="button" className="btn text" onClick={onClose}>
            닫기
          </button>
        </div>

        {/* Search Input Area */}
        <div className="archive-search-container" style={{
          padding: "12px 20px",
          borderBottom: "1px solid var(--border)",
          backgroundColor: "#fafafa",
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }}>
          <input
            type="text"
            placeholder="제목, 목표, 일정 및 메모 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="header-input"
            style={{
              padding: "6px 12px",
              fontSize: "13px",
              flex: 1
            }}
          />
          {searchQuery && (
            <button
              type="button"
              className="btn text"
              onClick={() => setSearchQuery("")}
              style={{ padding: "4px 8px", fontSize: "11px" }}
            >
              초기화
            </button>
          )}
        </div>

        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {archiveKeys.length === 0 ? (
            <p className="modal-empty">아직 보관된 기록이 없습니다.</p>
          ) : filteredKeys.length === 0 ? (
            <p className="modal-empty">검색 결과와 일치하는 기록이 없습니다.</p>
          ) : (
            sortedMonths.map((month) => (
              <div key={month} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <h3 style={{
                  fontSize: "11px",
                  color: "var(--text-3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  borderBottom: "1px solid var(--border)",
                  paddingBottom: "4px",
                  margin: 0
                }}>{month}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {groupedKeys[month].map((key) => {
                    const archive = archives[key];
                    const defaultTitle = getDefaultTitleFromWeekKey(key);
                    const displayTitle = archive.title || defaultTitle;
                    const isCurrentView = viewingArchiveKey === key;

                    // Compute statistics
                    const totalTasks = archive.tasks?.length || 0;
                    const dumpCheckboxes = archive.brainDump?.filter((b) => b.type === "checkbox") || [];
                    const completedDump = dumpCheckboxes.filter((b) => b.checked).length;
                    const totalDump = dumpCheckboxes.length;

                    return (
                      <div
                        key={key}
                        className={`archive-item-card ${isCurrentView ? "active" : ""}`}
                        style={{
                          padding: "14px 16px",
                          border: isCurrentView ? "2px solid var(--text)" : "1px solid var(--border)",
                          borderRadius: "8px",
                          backgroundColor: isCurrentView ? "#fafafa" : "#ffffff",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          transition: "all 0.15s ease"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "between", alignItems: "start", width: "100%" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>
                                {displayTitle}
                              </span>
                              {isCurrentView && (
                                <span style={{
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  color: "var(--text)",
                                  backgroundColor: "#e5e5e5",
                                  padding: "2px 6px",
                                  borderRadius: "4px"
                                }}>
                                  조회 중
                                </span>
                              )}
                            </div>
                            <div style={{
                              display: "flex",
                              gap: "12px",
                              fontSize: "11px",
                              color: "var(--text-3)",
                              marginTop: "4px"
                            }}>
                              <span>{key}</span>
                              {totalTasks > 0 && <span>일정 {totalTasks}개</span>}
                              {totalDump > 0 && <span>메모 {completedDump}/{totalDump}</span>}
                            </div>
                          </div>

                          <div className="archive-actions" style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                            <button
                              type="button"
                              className={`btn sm ${isCurrentView ? "outline" : "filled"}`}
                              onClick={() => onRestore(key)}
                            >
                              조회
                            </button>
                            <button
                              type="button"
                              className="btn outline sm danger"
                              onClick={() => removeArchive(key)}
                              style={{ padding: "7px 10px" }}
                            >
                              삭제
                            </button>
                          </div>
                        </div>

                        {/* Big 3 Goals Preview */}
                        {archive.big3 && archive.big3.some(Boolean) && (
                          <div style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "6px",
                            borderTop: "1px dashed var(--border)",
                            paddingTop: "8px",
                            marginTop: "4px"
                          }}>
                            {archive.big3.map((item, i) => item && (
                              <span
                                key={i}
                                style={{
                                  fontSize: "11px",
                                  backgroundColor: "#f2f2f2",
                                  color: "var(--text-2)",
                                  padding: "2px 8px",
                                  borderRadius: "4px",
                                  fontWeight: 500,
                                  maxWidth: "180px",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap"
                                }}
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
