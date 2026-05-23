/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  // Split lines
  const lines = content.split("\n");
  let inTable = false;
  let tableHeader: string[] = [];
  let tableRows: string[][] = [];

  const renderedElements: React.ReactNode[] = [];

  const parseInlineMarkdown = (text: string) => {
    // Standard bold matching: **text**
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="text-amber-300 font-semibold">{part}</strong>;
      }
      // Simple code block matching: `code`
      const subParts = part.split(/`([^`]+)`/g);
      return subParts.map((subPart, j) => {
        if (j % 2 === 1) {
          return <code key={j} className="bg-slate-900 px-1 py-0.5 rounded font-mono text-amber-400 text-xs border border-amber-950/40">{subPart}</code>;
        }
        return subPart;
      });
    });
  };

  const processTable = () => {
    if (tableRows.length > 0) {
      renderedElements.push(
        <div key={`table-${renderedElements.length}`} className="my-6 overflow-x-auto rounded-lg border border-amber-900/40 bg-slate-950/80">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-amber-950/30 text-xs uppercase text-amber-400 border-b border-amber-900/40">
              <tr>
                {tableHeader.map((th, index) => (
                  <th key={index} className="px-4 py-3 font-semibold font-mono">{th.trim()}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-950/20">
              {tableRows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-amber-900/10 transition-colors">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3 font-mono">
                      {parseInlineMarkdown(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    tableHeader = [];
    tableRows = [];
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Table parsing
    if (line.startsWith("|")) {
      inTable = true;
      const cells = line.split("|").slice(1, -1);
      
      // Check if it's separator: |---|---|
      if (cells.every(c => c.trim().startsWith("-"))) {
        continue;
      }

      if (tableHeader.length === 0) {
        tableHeader = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      // Table ended
      processTable();
    }

    // Headings
    if (line.startsWith("### ")) {
      renderedElements.push(
        <h3 key={i} className="text-lg font-bold text-amber-400 mt-6 mb-3 border-b border-amber-900/20 pb-1 tracking-tight">
          {parseInlineMarkdown(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith("#### ")) {
      renderedElements.push(
        <h4 key={i} className="text-md font-semibold text-amber-500 mt-4 mb-2 tracking-tight">
          {parseInlineMarkdown(line.slice(5))}
        </h4>
      );
    } else if (line.startsWith("## ")) {
      renderedElements.push(
        <h2 key={i} className="text-xl font-extrabold text-amber-300 mt-8 mb-4 border-l-4 border-amber-500 pl-3 tracking-tight">
          {parseInlineMarkdown(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      renderedElements.push(
        <h1 key={i} className="text-2xl font-bold text-amber-200 mt-10 mb-6 font-serif">
          {parseInlineMarkdown(line.slice(2))}
        </h1>
      );
    }
    // Lists
    else if (line.startsWith("* ") || line.startsWith("- ")) {
      renderedElements.push(
        <div key={i} className="flex items-start ml-4 my-1.5 text-slate-300 text-sm">
          <span className="text-amber-500 mr-2 select-none">•</span>
          <span className="flex-1">{parseInlineMarkdown(line.slice(2))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.*)/);
      if (match) {
        renderedElements.push(
          <div key={i} className="flex items-start ml-4 my-2 text-slate-300 text-sm">
            <span className="text-amber-400 font-mono font-bold mr-2 select-none">{match[1]}.</span>
            <span className="flex-1">{parseInlineMarkdown(match[2])}</span>
          </div>
        );
      }
    }
    // Empty Line
    else if (line === "") {
      renderedElements.push(<div key={i} className="h-2" />);
    }
    // Regular Paragraph
    else {
      renderedElements.push(
        <p key={i} className="text-slate-300 text-sm leading-relaxed my-2 text-justify">
          {parseInlineMarkdown(line)}
        </p>
      );
    }
  }

  // Handle trailing table if any
  if (inTable) {
    processTable();
  }

  return <div className="space-y-1 font-sans">{renderedElements}</div>;
};
