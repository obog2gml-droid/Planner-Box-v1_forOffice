"use client";

import React from "react";
import { BrainDumpEditor, DumpBlock } from "@/components/BrainDumpEditor";

interface SidebarProps {
  brainDump: DumpBlock[];
  setBrainDump: (val: DumpBlock[]) => void;
  big3: string[];
  setBig3: (val: string[]) => void;
  onOpenArchive: () => void;
  onOpenPdf: () => void;
}

const BIG3_PLACEHOLDERS = [
  "최우선 과제",
  "주요 완료 과제",
  "추가 집중 과제",
];

export const Sidebar: React.FC<SidebarProps> = ({
  brainDump,
  setBrainDump,
  big3,
  setBig3,
  onOpenArchive,
  onOpenPdf,
}) => {
  const handleBig3Change = (index: number, value: string) => {
    const next = [...big3];
    next[index] = value;
    setBig3(next);
  };

  return (
    <>
      <section className="section">
        <h2 className="sec-title">주간 목표</h2>
        <ol className="goal-list">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <input
                type="text"
                value={big3[i] || ""}
                onChange={(e) => handleBig3Change(i, e.target.value)}
                placeholder={BIG3_PLACEHOLDERS[i]}
                className="goal-input"
              />
            </li>
          ))}
        </ol>
      </section>

      <section className="section dump-section">
        <h2 className="sec-title memo-title">메모</h2>
        <BrainDumpEditor blocks={brainDump} onChange={setBrainDump} />
      </section>

      <div className="sidebar-footer">
        <button type="button" className="btn outline sm" onClick={onOpenArchive}>
          기록 보관함
        </button>
        <button type="button" className="btn filled sm" onClick={onOpenPdf}>
          PDF 내보내기
        </button>
      </div>
    </>
  );
};
