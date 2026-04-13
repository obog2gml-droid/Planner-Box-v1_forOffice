"use client";

import React, { useMemo, useState } from "react";
import { DumpBlock } from "@/components/BrainDumpEditor";
import { Task } from "@/lib/types";

interface ArchiveEntry {
  tasks: Task[];
  brainDump: DumpBlock[];
  big3: string[];
  title: string;
  subtitle: string;
}

interface ArchiveModalProps {
  onClose: () => void;
  onRestore: (data: ArchiveEntry) => void;
}

export const ArchiveModal: React.FC<ArchiveModalProps> = ({ onClose, onRestore }) => {
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

  const archiveKeys = useMemo(() => Object.keys(archives).sort().reverse(), [archives]);

  const removeArchive = (key: string) => {
    const next = { ...archives };
    delete next[key];
    setArchives(next);
    localStorage.setItem("timebox-archives", JSON.stringify(next));
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-backdrop" onClick={onClose} />

      <div className="modal-card">
        <div className="modal-header">
          <h2>기록 보관함</h2>
          <button type="button" className="btn text" onClick={onClose}>
            닫기
          </button>
        </div>

        <div className="modal-body">
          {archiveKeys.length === 0 ? (
            <p className="modal-empty">아직 보관된 기록이 없습니다.</p>
          ) : (
            archiveKeys.map((key) => (
              <div key={key} className="archive-row">
                <div className="archive-label">{formatArchiveLabel(key)}</div>
                <div className="archive-actions">
                  <button type="button" className="btn outline sm" onClick={() => onRestore(archives[key])}>
                    복원
                  </button>
                  <button type="button" className="btn text danger" onClick={() => removeArchive(key)}>
                    삭제
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

function formatArchiveLabel(key: string) {
  const parts = key.match(/(\d{4})-W(\d{2})/);
  if (!parts) return key;
  return `${parts[1]}년 ${parts[2]}주차`;
}
