"use client";

import React, { useState } from "react";

interface HeaderProps {
  title: string;
  setTitle: (val: string) => void;
  subtitle: string;
  setSubtitle: (val: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  setTitle,
  subtitle,
  setSubtitle,
}) => {
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingSubtitle, setEditingSubtitle] = useState(false);

  return (
    <header className="header">
      {editingTitle ? (
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => setEditingTitle(false)}
          onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
          className="header-input title-input"
          maxLength={24}
        />
      ) : (
        <h1 className="title" onDoubleClick={() => setEditingTitle(true)} title="더블클릭하여 수정">
          {title}
        </h1>
      )}

      {editingSubtitle ? (
        <input
          autoFocus
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          onBlur={() => setEditingSubtitle(false)}
          onKeyDown={(e) => e.key === "Enter" && setEditingSubtitle(false)}
          className="header-input sub-input"
          maxLength={40}
        />
      ) : (
        <p className="sub" onDoubleClick={() => setEditingSubtitle(true)} title="더블클릭하여 수정">
          {subtitle || "·"}
        </p>
      )}
    </header>
  );
};
