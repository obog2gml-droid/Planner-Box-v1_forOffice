"use client";

import React, { useEffect, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";

export type DumpBlockType = "text" | "bullet" | "checkbox";

export interface DumpBlock {
  id: string;
  type: DumpBlockType;
  content: string;
  depth: number;
  checked?: boolean;
}

interface BrainDumpEditorProps {
  blocks: DumpBlock[];
  onChange: (blocks: DumpBlock[]) => void;
}

const MAX_DEPTH = 2;

const createEmptyBlock = (): DumpBlock => ({
  id: crypto.randomUUID(),
  type: "text",
  content: "",
  depth: 0,
  checked: false,
});

export const BrainDumpEditor: React.FC<BrainDumpEditorProps> = ({ blocks, onChange }) => {
  const [allSelected, setAllSelected] = useState(false);
  const inputRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  useEffect(() => {
    if (blocks.length === 0) {
      onChange([createEmptyBlock()]);
    }
  }, [blocks.length, onChange]);

  useEffect(() => {
    const clearAll = () => setAllSelected(false);
    window.addEventListener("mousedown", clearAll);
    return () => window.removeEventListener("mousedown", clearAll);
  }, []);

  const updateAt = (index: number, patch: Partial<DumpBlock>) => {
    const next = [...blocks];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const focusBlock = (id: string | undefined, toEnd: boolean) => {
    if (!id) return;
    setTimeout(() => {
      const input = inputRefs.current[id];
      if (!input) return;
      input.focus();
      const pos = toEnd ? input.value.length : 0;
      input.setSelectionRange(pos, pos);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, index: number) => {
    const block = blocks[index];
    if (!block) return;

    if (e.key === "Enter") {
      if (e.nativeEvent.isComposing) return;
      e.preventDefault();
      
      // If list item is empty, convert back to text
      if ((block.type === "bullet" || block.type === "checkbox") && block.content.trim() === "") {
        if (block.depth > 0) {
          updateAt(index, { depth: block.depth - 1 });
        } else {
          updateAt(index, { type: "text", checked: false });
        }
        return;
      }

      const selectionStart = e.currentTarget.selectionStart || 0;
      const selectionEnd = e.currentTarget.selectionEnd || 0;
      const before = block.content.slice(0, selectionStart);
      const after = block.content.slice(selectionEnd);

      const next = [...blocks];
      next[index] = { ...block, content: before };
      
      const newBlock: DumpBlock = {
        id: crypto.randomUUID(),
        type: block.type,
        content: after,
        depth: block.depth,
        checked: false,
      };
      
      next.splice(index + 1, 0, newBlock);
      onChange(next);
      focusBlock(newBlock.id, false);
      return;
    }

    if (e.key === "Backspace") {
      const selectionStart = e.currentTarget.selectionStart;
      const selectionEnd = e.currentTarget.selectionEnd;

      if (selectionStart === 0 && selectionEnd === 0) {
        e.preventDefault();

        // 1. If depth > 0, reduce depth
        if (block.depth > 0) {
          updateAt(index, { depth: block.depth - 1 });
          return;
        }

        // 2. If it's a list item, convert to text
        if (block.type !== "text") {
          updateAt(index, { type: "text", checked: false });
          return;
        }

        // 3. If it's the first line, do nothing
        if (index === 0) return;

        // 4. Merge with previous block
        const prevBlock = blocks[index - 1];
        const next = [...blocks];
        const combinedContent = prevBlock.content + block.content;
        
        next[index - 1] = { ...prevBlock, content: combinedContent };
        next.splice(index, 1);
        
        onChange(next);
        focusBlock(prevBlock.id, false);
        // Position caret at end of previous content
        setTimeout(() => {
          const input = inputRefs.current[prevBlock.id];
          if (input) {
            input.setSelectionRange(prevBlock.content.length, prevBlock.content.length);
          }
        }, 0);
        return;
      }
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const maxDepth = block.type === "text" ? 1 : MAX_DEPTH;
      updateAt(index, {
        depth: e.shiftKey ? Math.max(0, block.depth - 1) : Math.min(maxDepth, block.depth + 1),
      });
      return;
    }

    if ((e.key === "a" || e.key === "A") && (e.ctrlKey || e.metaKey)) {
      const input = e.currentTarget;
      if (input.selectionStart === 0 && input.selectionEnd === input.value.length) {
        e.preventDefault();
        setAllSelected(true);
      }
      return;
    }

    if ((e.key === "Backspace" || e.key === "Delete") && allSelected) {
      e.preventDefault();
      const first = createEmptyBlock();
      onChange([first]);
      setAllSelected(false);
      focusBlock(first.id, false);
      return;
    }

    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const isUp = e.key === "ArrowUp";
      const target = isUp ? index - 1 : index + 1;
      const input = e.currentTarget;
      const atTop = input.selectionStart === 0;
      const atBottom = input.selectionStart === input.value.length;

      if ((isUp && atTop) || (!isUp && atBottom)) {
        const targetBlock = blocks[target];
        if (targetBlock) {
          e.preventDefault();
          focusBlock(targetBlock.id, isUp);
        }
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>, index: number) => {
    setAllSelected(false);
    const raw = e.target.value;
    const block = blocks[index];

    if (raw.startsWith("- ")) {
      updateAt(index, { type: "bullet", content: raw.slice(2) });
      return;
    }

    if (raw.startsWith("[] ")) {
      updateAt(index, { type: "checkbox", content: raw.slice(3), checked: false });
      return;
    }

    updateAt(index, { content: raw });
  };

  return (
    <ul
      className="dump-list memo-editor"
      onPointerDown={(e) => {
        if (e.target !== e.currentTarget) return;
        const last = blocks[blocks.length - 1];
        if (!last) return;
        e.preventDefault();
        focusBlock(last.id, true);
      }}
    >
      {blocks.map((block, idx) => (
        <li
          key={block.id}
          className={`memo-item ${block.type} ${block.checked ? "done" : ""} ${
            allSelected ? "selected" : ""
          }`}
          style={{ paddingLeft: `${block.depth * 14}px` }}
        >
          <div className="memo-prefix" aria-hidden={block.type === "text"}>
            {block.type === "bullet" ? (
              <span className={`memo-marker ${block.depth > 0 ? "nested" : ""}`} aria-hidden>
                {block.depth > 0 ? "·" : "-"}
              </span>
            ) : null}

            {block.type === "checkbox" ? (
              <input
                type="checkbox"
                className="memo-check"
                checked={Boolean(block.checked)}
                onChange={(e) => updateAt(idx, { checked: e.target.checked })}
                aria-label={block.checked ? "완료 해제" : "완료"}
              />
            ) : null}
          </div>

          <TextareaAutosize
            cacheMeasurements
            ref={(el) => {
              inputRefs.current[block.id] = el;
            }}
            value={block.content}
            onChange={(e) => handleChange(e, idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className="memo-input"
            placeholder={idx === 0 ? "디자인 시스템 리팩토링 계획 작성" : ""}
          />
        </li>
      ))}
    </ul>
  );
};

