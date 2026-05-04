"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WeeklyPlanData } from "@/lib/life-os/types";

interface ExportPlanButtonProps {
  data: WeeklyPlanData;
}

export function ExportPlanButton({ data }: ExportPlanButtonProps) {
  const handleExport = () => {
    const weekStart = new Date(data.weekStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const formatDate = (d: Date) =>
      d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Weekly Plan - ${data.weekTheme}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #fff;
    }
    .container {
      max-width: 8.5in;
      height: 11in;
      margin: 0 auto;
      padding: 0.75in;
      background: white;
    }
    .header {
      border-bottom: 3px solid #1D9E75;
      padding-bottom: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .week-meta {
      font-size: 0.85rem;
      color: #6b7280;
      margin-bottom: 0.5rem;
    }
    h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #1D9E75;
      margin-bottom: 0.5rem;
    }
    .date-range {
      font-size: 0.95rem;
      color: #4b5563;
    }
    .section {
      margin-bottom: 1.5rem;
    }
    .section-title {
      font-size: 0.9rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #374151;
      margin-bottom: 0.75rem;
      border-left: 3px solid #1D9E75;
      padding-left: 0.5rem;
    }
    .priorities-list, .habits-list {
      list-style: none;
    }
    .priorities-list li {
      padding: 0.5rem 0;
      padding-left: 1.5rem;
      position: relative;
      font-size: 0.9rem;
    }
    .priorities-list li:before {
      content: "•";
      position: absolute;
      left: 0;
      color: #1D9E75;
      font-weight: bold;
    }
    .habits-list li {
      padding: 0.35rem 0;
      padding-left: 1.5rem;
      position: relative;
      font-size: 0.85rem;
      color: #4b5563;
    }
    .habits-list li:before {
      content: "◇";
      position: absolute;
      left: 0;
      color: #1D9E75;
    }
    .day-block {
      margin-bottom: 0.75rem;
      padding: 0.5rem;
      background: #f9fafb;
      border-left: 3px solid #1D9E75;
      page-break-inside: avoid;
    }
    .day-title {
      font-weight: 600;
      color: #1D9E75;
      font-size: 0.9rem;
      margin-bottom: 0.25rem;
    }
    .day-theme {
      font-size: 0.8rem;
      color: #6b7280;
      font-style: italic;
      margin-bottom: 0.4rem;
    }
    .block-item {
      font-size: 0.8rem;
      padding-left: 0.5rem;
      margin: 0.2rem 0;
      color: #374151;
    }
    .time {
      color: #6b7280;
      font-weight: 500;
    }
    .footer {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 0.75rem;
      color: #9ca3af;
    }
    .grocery, .finances, .workouts {
      font-size: 0.85rem;
    }
    @media print {
      body { margin: 0; padding: 0; }
      .container { margin: 0; padding: 0.75in; height: auto; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="week-meta">WEEKLY PLAN</div>
      <h1>${data.weekTheme}</h1>
      <div class="date-range">${formatDate(weekStart)} – ${formatDate(weekEnd)}</div>
    </div>

    ${
      data.topPriorities && data.topPriorities.length > 0
        ? `
    <div class="section">
      <div class="section-title">Top Priorities</div>
      <ol class="priorities-list">
        ${data.topPriorities.map((p) => `<li>${p}</li>`).join("")}
      </ol>
    </div>
    `
        : ""
    }

    ${
      data.keyHabits && data.keyHabits.length > 0
        ? `
    <div class="section">
      <div class="section-title">Daily Habits</div>
      <ul class="habits-list">
        ${data.keyHabits.map((h) => `<li>${h}</li>`).join("")}
      </ul>
    </div>
    `
        : ""
    }

    ${
      data.days && data.days.length > 0
        ? `
    <div class="section">
      <div class="section-title">Daily Schedule</div>
      ${data.days
        .map(
          (day) => `
        <div class="day-block">
          <div class="day-title">${day.key.charAt(0).toUpperCase() + day.key.slice(1)}</div>
          ${day.theme ? `<div class="day-theme">${day.theme}</div>` : ""}
          ${day.blocks
            .map(
              (block) =>
                `<div class="block-item"><span class="time">${block.start}–${block.end}</span> ${block.label}</div>`
            )
            .join("")}
        </div>
      `
        )
        .join("")}
    </div>
    `
        : ""
    }

    ${
      data.workouts && data.workouts.length > 0
        ? `
    <div class="section">
      <div class="section-title">Workouts</div>
      <div class="workouts">
        ${data.workouts
          .map(
            (w) => `
          <div style="margin-bottom: 0.5rem;">
            <strong>${w.name}</strong> (${w.day})<br/>
            <span style="color: #6b7280;">${w.focus}</span><br/>
            ${w.lifts.map((l) => `<span style="color: #4b5563;">${l}</span><br/>`).join("")}
            ${w.cardio ? `<span style="color: #4b5563;">Cardio: ${w.cardio}</span><br/>` : ""}
          </div>
        `
          )
          .join("")}
      </div>
    </div>
    `
        : ""
    }

    ${
      data.grocery && data.grocery.items && data.grocery.items.length > 0
        ? `
    <div class="section">
      <div class="section-title">Grocery List</div>
      <div class="grocery">
        ${data.grocery.items.map((item) => `<div>• ${item.name} (${item.qty})</div>`).join("")}
        ${data.grocery.estimatedBudgetEUR ? `<div style="margin-top: 0.25rem; color: #6b7280;">Budget: €${data.grocery.estimatedBudgetEUR}</div>` : ""}
      </div>
    </div>
    `
        : ""
    }

    <div class="footer">
      Generated by AIAH • Your Life OS Companion
    </div>
  </div>
</body>
</html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      className="rounded-xl text-xs h-8"
      title="Download weekly plan as PDF"
    >
      <Download className="h-3.5 w-3.5 mr-1.5" />
      Download PDF
    </Button>
  );
}
