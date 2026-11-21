import { AppLanguage } from "./translations";

export interface WorkspaceCopy {
  // Header & Actions
  activeStudyPlan: string;
  exportCalendar: string;
  exportedIcs: string;
  fallingBehind: string;
  newPlan: string;
  // Tabs
  tabTimeline: string;
  tabCertificate: string;
  tabMaterials: string;
  tabProofs: string;
  // Timeline / Days / Tasks
  dayLabel: (day: number) => string;
  doneCount: (done: number, total: number) => string;
  restDayBadge: string;
  restDayDesc: string;
  sequentialLockBadge: string;
  nextDayWaitBadge: (dateLabel: string) => string;
  lockedUntilTomorrowReason: (dateLabel: string) => string;
  lockedPriorDayReason: (prevDay: number) => string;
  lockedMidExamReason: (midDay: number, currentDay: number) => string;
  breakdownStepsLabel: (done: number, total: number) => string;
  focusBtn: string;
  lockedBtn: string;
  showingDaysProgress: (visible: number, total: number) => string;
  // Sidebar Summary
  seqExamsCertTitle: string;
  pptWeightBadge: (pts: number) => string;
  earnedSummary: (pts: number, syl: number) => string;
  unlockedEndStatus: string;
  lockedEndStatus: (pts: number) => string;
  tierLadderLine: string;
  midExamLabel: (day: number) => string;
  finalExamLabel: (day: number) => string;
  certSidebarLabel: string;
  passedScore: (score: number) => string;
  readyToTakeExam: string;
  lockedExamPriorDays: (maxDay: number) => string;
  mintedStatus: (id: string) => string;
  readyToClaimCert: string;
  previewOnChainCert: string;
  studyProofTitle: string;
  walletConnected: string;
  optionalTag: string;
  studyProofDesc: string;
  openProgressProof: string;
  // Burnout Meter
  lowRiskTitle: string;
  lowRiskDesc: string;
  modRiskTitle: string;
  modRiskDesc: string;
  highRiskTitle: string;
  highRiskDesc: string;
  weeklyTarget: string;
  hrsSuffix: string;
  scheduledRecovery: string;
  // Uploader
  uploaderTitle: string;
  uploaderSubtitle: string;
  pipelineBadge: string;
  tabPresets: string;
  tabUploadFile: string;
  tabPasteText: string;
  selectSampleCourse: string;
  syllabusDocLabel: string;
  pasteSyllabusLabel: string;
  pastePlaceholder: string;
  courseTitleLabel: string;
  courseTitlePlaceholder: string;
  totalDurationLabel: string;
  customDurationHint: (days: string) => string;
  maxDailyLimitLabel: string;
  hardCapHint: string;
  pacingPrefsLabel: string;
  includeRestDaysLabel: string;
  restDaysHint: string;
  liveExecutionTitle: string;
  agent1Label: string;
  agent1Detail: string;
  agent2Label: string;
  agent2Detail: string;
  agent3Label: string;
  agent3Detail: string;
  validatorActive: string;
  runningAgentsBtn: string;
  launchPipelineBtn: string;
  // Reading Materials
  materialsHeaderTitle: string;
  materialsHeaderDesc: string;
  syncMaterialsBtn: string;
  syncingMaterialsBtn: string;
  section1Title: (count: number) => string;
  section1Badge: string;
  searchPaperBtn: string;
  section2Title: string;
  verifiedSourcesCount: (count: number) => string;
  aiNotesBadge: string;
  openAlexBadge: string;
  wikiBadge: string;
  emptyMaterialsSyncing: string;
  emptyMaterialsIdle: string;
}

const EN_COPY: WorkspaceCopy = {
  activeStudyPlan: "Active Study Plan",
  exportCalendar: "Export Calendar",
  exportedIcs: "Exported .ics",
  fallingBehind: "I'm Falling Behind",
  newPlan: "New Plan",
  tabTimeline: "Daily Study Plan",
  tabCertificate: "Certificate & $SYL Coin",
  tabMaterials: "Reading Materials",
  tabProofs: "Progress Proof",
  dayLabel: (day) => `Day ${day}`,
  doneCount: (done, total) => `${done}/${total} done`,
  restDayBadge: "Rest & Rebalance",
  restDayDesc:
    "Cognitive Recovery Day · Scheduled rest interval to prevent academic burnout.",
  sequentialLockBadge: "Sequential Lock",
  nextDayWaitBadge: (dateLabel) => `Unlocks ${dateLabel}`,
  lockedUntilTomorrowReason: (dateLabel) =>
    `Locked until ${dateLabel} — You must wait until the next scheduled day arrives so studying stays consistent day by day.`,
  lockedPriorDayReason: (prevDay) =>
    `Locked — Complete all tasks in Day ${prevDay} first in sequential order.`,
  lockedMidExamReason: (midDay, currentDay) =>
    `Locked — Complete and pass the Mid-Session Exam (5 MC + 2 Essay) after Day ${midDay} to unlock Day ${currentDay}.`,
  breakdownStepsLabel: (done, total) => `Breakdown Steps (${done}/${total})`,
  focusBtn: "Focus",
  lockedBtn: "Locked",
  showingDaysProgress: (visible, total) =>
    `Showing ${visible} of ${total} days — Scroll or click to reveal more`,
  seqExamsCertTitle: "Sequential Exams & Certificate",
  pptWeightBadge: (pts) => `PPT Weight: ${pts}/5 Pts`,
  earnedSummary: (pts, syl) => `+${pts} Pts · +${syl} $SYL`,
  unlockedEndStatus: "Unlocked!",
  lockedEndStatus: (pts) => `Unlocked at End (+${pts} Pts)`,
  tierLadderLine:
    "Tiers: Bronze (20) · Silver (40) · Gold (65) · Platinum (95) · Diamond (130) · Emerald (175)",
  midExamLabel: (day) => `1. Mid-Session Exam (Day ${day})`,
  finalExamLabel: (day) => `2. Final-Session Exam (Day ${day})`,
  certSidebarLabel: "3. Blockchain Certificate & $SYL",
  passedScore: (score) => `Passed · Score ${score}/100`,
  readyToTakeExam: "Ready to Take (5 MC + 2 Essay)",
  lockedExamPriorDays: (maxDay) => `Locked (Complete Days 1-${maxDay})`,
  mintedStatus: (id) => `Minted (${id})`,
  readyToClaimCert: "Ready to Claim on Base Sepolia!",
  previewOnChainCert: "View On-Chain Certificate & $SYL",
  studyProofTitle: "Study Proof",
  walletConnected: "Wallet Connected",
  optionalTag: "Optional",
  studyProofDesc:
    "Save a tamper-proof cryptographic snapshot of this study roadmap on-chain.",
  openProgressProof: "Open Progress Proof",
  lowRiskTitle: "Low Burnout Risk",
  lowRiskDesc:
    "Pacing is sustainable with reasonable cognitive load distribution.",
  modRiskTitle: "Moderate Burnout Risk",
  modRiskDesc:
    "Study load has dense stretches. Keep sessions capped at 90 minutes.",
  highRiskTitle: "High Burnout Risk",
  highRiskDesc:
    "High probability of academic exhaustion. Insert rest days or shift dates.",
  weeklyTarget: "Weekly Target",
  hrsSuffix: "hrs",
  scheduledRecovery: "Scheduled Recovery",
  uploaderTitle: "Generate Anti-Burnout Study Roadmap",
  uploaderSubtitle:
    "Specialized AI agents decompose your uploaded PPT or syllabus into slide-specific micro-tasks with LaTeX formulas and matched reading notes.",
  pipelineBadge: "4-Agent Pipeline",
  tabPresets: "Quick Presets",
  tabUploadFile: "Upload PPT / PDF",
  tabPasteText: "Paste Text",
  selectSampleCourse: "Select Sample Course",
  syllabusDocLabel: "Upload Slide Deck (PPTX, PDF) or Syllabus (DOCX, TXT)",
  pasteSyllabusLabel: "Syllabus or Slide Content Text",
  pastePlaceholder:
    "Paste lecture slides, topic list, weekly milestones, or assignment specs here...",
  courseTitleLabel: "Course Title",
  courseTitlePlaceholder: "e.g. CS 161 Algorithms",
  totalDurationLabel: "Total Study Duration",
  customDurationHint: (days) => `Custom duration from 1 to 60 ${days}`,
  maxDailyLimitLabel: "Max Daily Study Limit",
  hardCapHint: "Hard-capped at 150 min/day",
  pacingPrefsLabel: "Pacing Preferences",
  includeRestDaysLabel: "Include weekly rest days",
  restDaysHint: "Active recovery to sustain focus",
  liveExecutionTitle: "Live Multi-Agent Execution",
  agent1Label: "Agent 1: Slide & Syllabus Extractor",
  agent1Detail: "Extracting slides, modules, and key technical concepts",
  agent2Label: "Agent 2 & 4: Micro-Task & LaTeX Planner",
  agent2Detail: "Building slide-specific steps with LaTeX and daily pacing",
  agent3Label: "Agent 3: PPT Reading & Literature Curator",
  agent3Detail: "Synthesizing AI reading guides and open-access papers from PPT",
  validatorActive: "15-30m sequential daily validator active",
  runningAgentsBtn: "Running Agents...",
  launchPipelineBtn: "Launch Agent Pipeline",
  materialsHeaderTitle:
    "AI Reading Materials & Slide Notes Matched to Your PPT",
  materialsHeaderDesc:
    "Deep-dive reading notes synthesized by Gemini AI directly from your uploaded PPT slides, paired with LaTeX derivations and verified OpenAlex papers.",
  syncMaterialsBtn: "Re-Sync AI Materials from PPT",
  syncingMaterialsBtn: "Analyzing PPT with AI...",
  section1Title: (count) =>
    `1. AI Reading Companion & Slide Formulas (${count} Modules)`,
  section1Badge: "AI Generated from PPT",
  searchPaperBtn: "Find Related Papers",
  section2Title:
    "2. Verified Open-Access Papers (OpenAlex) & Concept Encyclopedia",
  verifiedSourcesCount: (count) => `${count} verified items`,
  aiNotesBadge: "AI PPT Reading Guide",
  openAlexBadge: "OpenAlex Open-Access Paper",
  wikiBadge: "Concept Reference",
  emptyMaterialsSyncing:
    "Agent 3 is generating AI reading guides and fetching matching Open-Access papers from your PPT...",
  emptyMaterialsIdle:
    "Click 'Re-Sync AI Materials from PPT' above to generate slide-matched reading guides and Open-Access papers.",
};

const ID_COPY: WorkspaceCopy = {
  activeStudyPlan: "Rencana Belajar Aktif",
  exportCalendar: "Ekspor Kalender",
  exportedIcs: "Terekspor (.ics)",
  fallingBehind: "Saya Tertinggal",
  newPlan: "Rencana Baru",
  tabTimeline: "Rencana Belajar Harian",
  tabCertificate: "Sertifikat & Koin $SYL",
  tabMaterials: "Materi Bacaan AI",
  tabProofs: "Bukti Progres On-Chain",
  dayLabel: (day) => `Hari ${day}`,
  doneCount: (done, total) => `${done}/${total} selesai`,
  restDayBadge: "Istirahat & Pemulihan",
  restDayDesc:
    "Hari Pemulihan Kognitif · Jadwal istirahat terukur untuk mencegah kelelahan belajar.",
  sequentialLockBadge: "Terkunci Berurutan",
  nextDayWaitBadge: (dateLabel) => `Terbuka ${dateLabel}`,
  lockedUntilTomorrowReason: (dateLabel) =>
    `Terkunci hingga ${dateLabel} — Meskipun hari sebelumnya sudah selesai, sesi hari berikutnya baru terbuka keesokan harinya sesuai jadwal agar belajar tetap konsisten.`,
  lockedPriorDayReason: (prevDay) =>
    `Terkunci — Selesaikan seluruh tugas pada Hari ${prevDay} terlebih dahulu secara berurutan.`,
  lockedMidExamReason: (midDay, currentDay) =>
    `Terkunci — Selesaikan dan lulus Ujian Tengah Sesi (5 PG + 2 Esai) setelah Hari ${midDay} untuk membuka Hari ${currentDay}.`,
  breakdownStepsLabel: (done, total) => `Langkah Detail Materi (${done}/${total})`,
  focusBtn: "Fokus",
  lockedBtn: "Terkunci",
  showingDaysProgress: (visible, total) =>
    `Menampilkan ${visible} dari ${total} hari — Gulir atau klik untuk membuka hari lainnya`,
  seqExamsCertTitle: "Ujian Berurutan & Sertifikat",
  pptWeightBadge: (pts) => `Bobot PPT: ${pts}/5 Poin`,
  earnedSummary: (pts, syl) => `+${pts} Poin · +${syl} $SYL`,
  unlockedEndStatus: "Sudah Cair!",
  lockedEndStatus: (pts) => `Cair di Akhir (+${pts} Poin)`,
  tierLadderLine:
    "Tier: Bronze (20) · Silver (40) · Gold (65) · Platinum (95) · Diamond (130) · Emerald (175)",
  midExamLabel: (day) => `1. Ujian Tengah Sesi (Hari ${day})`,
  finalExamLabel: (day) => `2. Ujian Akhir Sesi (Hari ${day})`,
  certSidebarLabel: "3. Sertifikat Blockchain & $SYL",
  passedScore: (score) => `Lulus · Skor ${score}/100`,
  readyToTakeExam: "Siap Dikerjakan (5 PG + 2 Esai)",
  lockedExamPriorDays: (maxDay) => `Terkunci (Selesaikan Hari 1-${maxDay})`,
  mintedStatus: (id) => `Diterbitkan (${id})`,
  readyToClaimCert: "Siap Klaim di Base Sepolia!",
  previewOnChainCert: "Buka Sertifikat Blockchain & $SYL",
  studyProofTitle: "Bukti Belajar On-Chain",
  walletConnected: "Wallet Terhubung",
  optionalTag: "Opsional",
  studyProofDesc:
    "Simpan snapshot kriptografis rencana belajar ini secara permanen di blockchain.",
  openProgressProof: "Buka Bukti Progres",
  lowRiskTitle: "Risiko Burnout Rendah",
  lowRiskDesc:
    "Ritme belajar seimbang dengan distribusi beban kognitif yang sehat.",
  modRiskTitle: "Risiko Burnout Sedang",
  modRiskDesc:
    "Beban belajar cukup padat. Jaga setiap sesi maksimal 90 menit.",
  highRiskTitle: "Risiko Burnout Tinggi",
  highRiskDesc:
    "Potensi kelelahan akademik tinggi. Gunakan jadwal istirahat atau geser tanggal.",
  weeklyTarget: "Target Mingguan",
  hrsSuffix: "jam",
  scheduledRecovery: "Jadwal Istirahat",
  uploaderTitle: "Buat Rencana Belajar Anti-Burnout",
  uploaderSubtitle:
    "Agen AI spesialis memecah PPT atau silabus Anda menjadi langkah belajar harian spesifik slide, lengkap dengan rumus LaTeX dan materi bacaan AI.",
  pipelineBadge: "4-Agen AI Terpadu",
  tabPresets: "Contoh Mata Kuliah",
  tabUploadFile: "Unggah PPT / PDF",
  tabPasteText: "Tempel Teks",
  selectSampleCourse: "Pilih Contoh Mata Kuliah",
  syllabusDocLabel: "Unggah Slide PPTX / PDF atau Silabus (DOCX, TXT)",
  pasteSyllabusLabel: "Teks Silabus atau Isi Slide PPT",
  pastePlaceholder:
    "Tempel materi slide kuliah, daftar topik, atau rincian tugas di sini...",
  courseTitleLabel: "Nama Mata Kuliah / Modul",
  courseTitlePlaceholder: "cth. Sistem Agentic AI & Orkestrasi",
  totalDurationLabel: "Total Durasi Belajar",
  customDurationHint: (days) => `Durasi kustom 1 hingga 60 ${days}`,
  maxDailyLimitLabel: "Batas Belajar Harian",
  hardCapHint: "Batas maksimal 150 menit/hari",
  pacingPrefsLabel: "Preferensi Ritme",
  includeRestDaysLabel: "Sertakan hari istirahat mingguan",
  restDaysHint: "Pemulihan kognitif untuk menjaga fokus",
  liveExecutionTitle: "Eksekusi Langsung Multi-Agen AI",
  agent1Label: "Agen 1: Ekstraktor Slide & Silabus",
  agent1Detail: "Membaca struktur slide PPT, topik inti, dan istilah teknis",
  agent2Label: "Agen 2 & 4: Perencana Tugas & Rumus LaTeX",
  agent2Detail: "Menyusun langkah detail spesifik slide dengan notasi LaTeX",
  agent3Label: "Agen 3: Penyusun Materi Bacaan & Referensi AI",
  agent3Detail: "Menyusun penjelasan mendalam dari PPT & jurnal Open-Access",
  validatorActive: "Validator tugas harian berurutan aktif",
  runningAgentsBtn: "Menjalankan Agen AI...",
  launchPipelineBtn: "Jalankan Agen AI & Buat Roadmap",
  materialsHeaderTitle:
    "Materi Bacaan & Penjelasan Mendalam Spesifik dari PPT Kamu",
  materialsHeaderDesc:
    "Menampilkan bahan bacaan yang disusun langsung oleh AI dari isi slide PPT kamu, lengkap dengan rumus LaTeX serta jurnal Open-Access yang sesuai topik.",
  syncMaterialsBtn: "Perbarui Materi Bacaan dari PPT",
  syncingMaterialsBtn: "AI Sedang Menganalisis PPT...",
  section1Title: (count) =>
    `1. Bahan Bacaan & Ringkasan Rumus Slide PPT (${count} Bagian)`,
  section1Badge: "100% Sesuai Slide PPT",
  searchPaperBtn: "Cari Jurnal Terkait Slide",
  section2Title:
    "2. Materi Bacaan Mendalam AI & Jurnal Open-Access Sesuai PPT",
  verifiedSourcesCount: (count) => `${count} materi terverifikasi`,
  aiNotesBadge: "Penjelasan AI dari PPT",
  openAlexBadge: "Jurnal Open-Access (OpenAlex)",
  wikiBadge: "Ensiklopedia Konsep",
  emptyMaterialsSyncing:
    "Agen 3 sedang menyusun materi bacaan AI dan mencari jurnal Open-Access yang sesuai dengan PPT kamu...",
  emptyMaterialsIdle:
    "Klik tombol 'Perbarui Materi Bacaan dari PPT' di atas untuk menghasilkan bacaan AI yang sesuai dengan slide PPT kamu.",
};

export function getWorkspaceCopy(lang: AppLanguage): WorkspaceCopy {
  if (lang === "id") return ID_COPY;
  return EN_COPY;
}
