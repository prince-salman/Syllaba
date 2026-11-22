import { Roadmap } from "@/shared/types/roadmap";

function resolveYmdParts(dateStr: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec((dateStr || "").trim());
  if (match) {
    return {
      year: parseInt(match[1], 10),
      month: parseInt(match[2], 10),
      day: parseInt(match[3], 10),
    };
  }
  const d = new Date(dateStr || Date.now());
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
  };
}

function pad2(n: number): string {
  return String(Math.max(0, Math.floor(n))).padStart(2, "0");
}

function formatLocalFloatingDateTime(
  dateStr: string,
  totalMinutesFromMidnight: number
): string {
  const { year, month, day } = resolveYmdParts(dateStr);
  const clampedMins = Math.max(0, Math.min(23 * 60 + 59, Math.round(totalMinutesFromMidnight)));
  const hh = Math.floor(clampedMins / 60);
  const mm = clampedMins % 60;
  return `${year}${pad2(month)}${pad2(day)}T${pad2(hh)}${pad2(mm)}00`;
}

function escapeICalText(text: string): string {
  return (text || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

export function generateICalendar(roadmap: Roadmap): string {
  const now = new Date();
  const dtStamp = `${now.getUTCFullYear()}${pad2(now.getUTCMonth() + 1)}${pad2(
    now.getUTCDate()
  )}T${pad2(now.getUTCHours())}${pad2(now.getUTCMinutes())}${pad2(
    now.getUTCSeconds()
  )}Z`;

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Syllaba//AI Study Roadmap Generator//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeICalText(roadmap.courseTitle)} Roadmap`,
  ];

  roadmap.dailySchedules.forEach((schedule) => {
    if (schedule.isRestDay) return;

    let cursorMinutes = 9 * 60; // Start study blocks cleanly at 09:00 local calendar time
    schedule.tasks.forEach((task) => {
      const duration = Math.max(10, Math.min(180, Math.round(task.estimatedMinutes || 25)));
      const startMins = Math.min(23 * 60 + 45 - duration, cursorMinutes);
      const endMins = Math.min(23 * 60 + 59, startMins + duration);
      cursorMinutes = Math.min(23 * 60 + 30, endMins + 15);

      const dtStart = formatLocalFloatingDateTime(schedule.date, startMins);
      const dtEnd = formatLocalFloatingDateTime(schedule.date, endMins);

      const subtaskText =
        task.subtasks.length > 0
          ? `\nSubtasks:\n- ${task.subtasks.map((s) => s.title).join("\n- ")}`
          : "";

      lines.push(
        "BEGIN:VEVENT",
        `UID:${task.id}@syllaba.xyz`,
        `DTSTAMP:${dtStamp}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:[${escapeICalText(roadmap.courseTitle)}] ${escapeICalText(task.title)}`,
        `DESCRIPTION:${escapeICalText(`${task.description}${subtaskText}`)}`,
        `CATEGORIES:${task.category.toUpperCase()}`,
        "STATUS:CONFIRMED",
        "END:VEVENT"
      );
    });
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadCalendarFile(roadmap: Roadmap) {
  const icsData = generateICalendar(roadmap);
  const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${(roadmap.courseTitle || "syllaba")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-roadmap.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
