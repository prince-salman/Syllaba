import { Roadmap } from "@/types/roadmap";

function formatICalDate(dateStr: string, hourOffset = 9): string {
  const d = new Date(dateStr);
  d.setHours(hourOffset, 0, 0, 0);
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function generateICalendar(roadmap: Roadmap): string {
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

    schedule.tasks.forEach((task, index) => {
      const startHour = 9 + (index * 2);
      const dtStart = formatICalDate(schedule.date, startHour);
      const endD = new Date(schedule.date);
      endD.setHours(startHour, task.estimatedMinutes, 0, 0);
      const dtEnd = endD.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

      const subtaskList = task.subtasks.length > 0
        ? `\\nSubtasks:\\n- ${task.subtasks.map(s => s.title).join("\\n- ")}`
        : "";

      lines.push(
        "BEGIN:VEVENT",
        `UID:${task.id}@syllaba.local`,
        `DTSTAMP:${formatICalDate(new Date().toISOString())}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:[${roadmap.courseTitle}] ${escapeICalText(task.title)}`,
        `DESCRIPTION:${escapeICalText(task.description)}${subtaskList}`,
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
  link.download = `${roadmap.courseTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-roadmap.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
