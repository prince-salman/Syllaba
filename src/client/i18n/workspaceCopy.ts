import { AppLanguage } from "./translations";

export interface WorkspaceCopy {
  // Header & Actions
  activeStudyPlan: string;
  exportCalendar: string;
  exportedIcs: string;
  fallingBehind: string;
  newPlan: string;
  // Sidebar Additions
  tierExchangeNav: string;
  tierExchangeMobileNav: string;
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
  // Uploader & Dropzone
  uploaderTitle: string;
  uploaderSubtitle: string;
  pipelineBadge: string;
  tabPresets: string;
  tabUploadFile: string;
  tabPasteText: string;
  selectSampleCourse: string;
  syllabusDocLabel: string;
  dropzoneIdleTitle: string;
  dropzoneLoadingTitle: string;
  dropzoneFormatsHint: string;
  dropzoneRemoveTitle: string;
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
  tierExchangeNav: "Tier Exchange & $SYL",
  tierExchangeMobileNav: "Tier Exchange (Bronze+) & $SYL",
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
    "Tiers: Bronze (5) · Silver (40) · Gold (65) · Platinum (95) · Diamond (130) · Emerald (175)",
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
  dropzoneIdleTitle: "Click or drag syllabus / deck here",
  dropzoneLoadingTitle: "Extracting document text...",
  dropzoneFormatsHint: "Supports up to 10 files (.pdf, .docx, .pptx, .txt · max 15 MB each)",
  dropzoneRemoveTitle: "Remove file",
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
  tierExchangeNav: "Tukar Sertifikat & $SYL",
  tierExchangeMobileNav: "Tukar Sertifikat (Bronze+) & $SYL",
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
    "Tier: Bronze (5) · Silver (40) · Gold (65) · Platinum (95) · Diamond (130) · Emerald (175)",
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
  dropzoneIdleTitle: "Klik atau seret silabus / file PPT ke sini",
  dropzoneLoadingTitle: "Mengekstrak isi dokumen...",
  dropzoneFormatsHint: "Mendukung hingga 10 file (.pdf, .docx, .pptx, .txt · maks 15 MB/file)",
  dropzoneRemoveTitle: "Hapus file",
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

const ZH_COPY: WorkspaceCopy = {
  activeStudyPlan: "当前学习计划",
  exportCalendar: "导出日历",
  exportedIcs: "已导出 .ics",
  fallingBehind: "进度落后了",
  newPlan: "新建计划",
  tierExchangeNav: "等级证书兑换 & $SYL",
  tierExchangeMobileNav: "等级证书兑换 (青铜+) & $SYL",
  tabTimeline: "每日学习路线图",
  tabCertificate: "证书与 $SYL 代币",
  tabMaterials: "AI 扩展阅读资料",
  tabProofs: "链上进度存证",
  dayLabel: (day) => `第 ${day} 天`,
  doneCount: (done, total) => `已完成 ${done}/${total}`,
  restDayBadge: "休息与平衡",
  restDayDesc: "认知恢复日 · 科学安排休息间隔以防止学习倦怠。",
  sequentialLockBadge: "顺序解锁",
  nextDayWaitBadge: (dateLabel) => `${dateLabel} 解锁`,
  lockedUntilTomorrowReason: (dateLabel) =>
    `锁定至 ${dateLabel} — 需等待计划日期到来以保持每日稳定节奏。`,
  lockedPriorDayReason: (prevDay) =>
    `已锁定 — 请先按顺序完成第 ${prevDay} 天的全部任务。`,
  lockedMidExamReason: (midDay, currentDay) =>
    `已锁定 — 完成第 ${midDay} 天后的期中测评（5选择 + 2简答）并及格后可解锁第 ${currentDay} 天。`,
  breakdownStepsLabel: (done, total) => `细分学习步骤 (${done}/${total})`,
  focusBtn: "专注计时",
  lockedBtn: "已锁定",
  showingDaysProgress: (visible, total) =>
    `当前显示 ${visible} / ${total} 天 — 滚动或点击展开更多`,
  seqExamsCertTitle: "阶段测评与认证证书",
  pptWeightBadge: (pts) => `课件权重: ${pts}/5 分`,
  earnedSummary: (pts, syl) => `+${pts} 积分 · +${syl} $SYL`,
  unlockedEndStatus: "已解锁！",
  lockedEndStatus: (pts) => `结业后解锁 (+${pts} 分)`,
  tierLadderLine:
    "等级: 青铜 (5) · 白银 (40) · 黄金 (65) · 铂金 (95) · 钻石 (130) · 翡翠 (175)",
  midExamLabel: (day) => `1. 期中测评（第 ${day} 天）`,
  finalExamLabel: (day) => `2. 期末综合测评（第 ${day} 天）`,
  certSidebarLabel: "3. 区块链证书 & $SYL",
  passedScore: (score) => `已通过 · 得分 ${score}/100`,
  readyToTakeExam: "可参加测评（5选择 + 2简答）",
  lockedExamPriorDays: (maxDay) => `已锁定（请先完成第 1-${maxDay} 天）`,
  mintedStatus: (id) => `已铸造 (${id})`,
  readyToClaimCert: "可在 Base Sepolia 免费领取！",
  previewOnChainCert: "查看链上证书与 $SYL",
  studyProofTitle: "链上学习证明",
  walletConnected: "钱包已连接",
  optionalTag: "可选",
  studyProofDesc: "将当前学习路线图的不可篡改加密快照保存至区块链。",
  openProgressProof: "打开进度证明",
  lowRiskTitle: "低倦怠风险",
  lowRiskDesc: "学习节奏可持续，认知负荷分布合理。",
  modRiskTitle: "中等倦怠风险",
  modRiskDesc: "部分时段任务较密集，建议单次学习不超过 90 分钟。",
  highRiskTitle: "高倦怠风险",
  highRiskDesc: "学术疲劳风险较高，建议插入休息日或顺延日期。",
  weeklyTarget: "每周目标",
  hrsSuffix: "小时",
  scheduledRecovery: "已安排休息日",
  uploaderTitle: "生成防倦怠智能学习路线图",
  uploaderSubtitle:
    "多智能体 AI 将你上传的 PPT 或教学大纲拆解为紧贴幻灯片的微任务，并附带 LaTeX 公式与匹配阅读资料。",
  pipelineBadge: "4-智能体协作流",
  tabPresets: "课程示例预设",
  tabUploadFile: "上传 PPT / PDF",
  tabPasteText: "粘贴大纲文本",
  selectSampleCourse: "选择示例课程",
  syllabusDocLabel: "上传课件 (PPTX, PDF) 或大纲文档 (DOCX, TXT)",
  dropzoneIdleTitle: "点击或拖拽教学大纲 / 课件到此",
  dropzoneLoadingTitle: "正在解析文档内容...",
  dropzoneFormatsHint: "支持最多同时上传 10 个文件（.pdf, .docx, .pptx, .txt · 单个最大 15 MB）",
  dropzoneRemoveTitle: "移除文件",
  pasteSyllabusLabel: "大纲或幻灯片文本内容",
  pastePlaceholder: "请在此粘贴课程幻灯片内容、主题列表或作业要求...",
  courseTitleLabel: "课程名称",
  courseTitlePlaceholder: "例如：CS 161 算法设计与分析",
  totalDurationLabel: "总学习周期",
  customDurationHint: (days) => `自定义周期 1 至 60 ${days}`,
  maxDailyLimitLabel: "每日学习上限",
  hardCapHint: "严格限制每日不超过 150 分钟",
  pacingPrefsLabel: "节奏偏好设置",
  includeRestDaysLabel: "包含每周休息恢复日",
  restDaysHint: "通过主动恢复保持专注力",
  liveExecutionTitle: "多智能体实时执行中",
  agent1Label: "智能体 1：课件与大纲提取器",
  agent1Detail: "正在提取幻灯片结构、模块与核心技术概念",
  agent2Label: "智能体 2 & 4：微任务与 LaTeX 规划器",
  agent2Detail: "生成包含 LaTeX 公式的逐日微步骤",
  agent3Label: "智能体 3：阅读资料与文献策展器",
  agent3Detail: "根据课件生成 AI 导读并检索开放获取论文",
  validatorActive: "每日 15–30 分钟顺序验证器已启用",
  runningAgentsBtn: "正在运行 AI 智能体...",
  launchPipelineBtn: "启动 AI 生成学习路线图",
  materialsHeaderTitle: "紧扣课件的 AI 深度阅读指南",
  materialsHeaderDesc:
    "由 Gemini AI 直接根据你上传的 PPT 生成深度导读笔记，结合 LaTeX 推导与 OpenAlex 开源论文。",
  syncMaterialsBtn: "从 PPT 重新同步 AI 阅读资料",
  syncingMaterialsBtn: "AI 正在分析课件...",
  section1Title: (count) => `1. AI 幻灯片精读与公式梳理（${count} 个模块）`,
  section1Badge: "基于 PPT 由 AI 生成",
  searchPaperBtn: "查找相关论文",
  section2Title: "2. 开放获取学术论文 (OpenAlex) 与概念百科",
  verifiedSourcesCount: (count) => `${count} 项已验证资料`,
  aiNotesBadge: "AI 课件精读指南",
  openAlexBadge: "OpenAlex 开源论文",
  wikiBadge: "概念参考百科",
  emptyMaterialsSyncing: "智能体 3 正在生成 AI 精读资料并检索匹配的开放获取论文...",
  emptyMaterialsIdle: "点击上方“从 PPT 重新同步 AI 阅读资料”以生成与课件匹配的导读。",
};

const AR_COPY: WorkspaceCopy = {
  activeStudyPlan: "خطة الدراسة النشطة",
  exportCalendar: "تصدير التقويم",
  exportedIcs: "تم التصدير (.ics)",
  fallingBehind: "تأخرت عن الجدول",
  newPlan: "خطة جديدة",
  tierExchangeNav: "استبدال المستويات و $SYL",
  tierExchangeMobileNav: "استبدال الشهادات (البرونزي+) و $SYL",
  tabTimeline: "خطة الدراسة اليومية",
  tabCertificate: "الشهادة وعملات $SYL",
  tabMaterials: "مواد القراءة الذكية",
  tabProofs: "إثبات التقدم على البلوكشين",
  dayLabel: (day) => `اليوم ${day}`,
  doneCount: (done, total) => `أنجزت ${done}/${total}`,
  restDayBadge: "راحة واستعادة التوازن",
  restDayDesc: "يوم تعافي معرفي · فترة راحة مجدولة لمنع الإرهاق الدراسي.",
  sequentialLockBadge: "قفل تسلسلي",
  nextDayWaitBadge: (dateLabel) => `يفتح في ${dateLabel}`,
  lockedUntilTomorrowReason: (dateLabel) =>
    `مقفل حتى ${dateLabel} — يجب انتظار اليوم المجدول التالي للحفاظ على انتظام الدراسة يومًا بيوم.`,
  lockedPriorDayReason: (prevDay) =>
    `مقفل — أكمل جميع مهام اليوم ${prevDay} أولًا بالترتيب التسلسلي.`,
  lockedMidExamReason: (midDay, currentDay) =>
    `مقفل — أكمل واجتز اختبار منتصف الجلسة (5 اختيار + 2 مقالي) بعد اليوم ${midDay} لفتح اليوم ${currentDay}.`,
  breakdownStepsLabel: (done, total) => `الخطوات التفصيلية (${done}/${total})`,
  focusBtn: "تركيز",
  lockedBtn: "مقفل",
  showingDaysProgress: (visible, total) =>
    `عرض ${visible} من أصل ${total} أيام — مرّر أو انقر لعرض المزيد`,
  seqExamsCertTitle: "الاختبارات التسلسلية والشهادة",
  pptWeightBadge: (pts) => `وزن الشرائح: ${pts}/5 نقاط`,
  earnedSummary: (pts, syl) => `+${pts} نقاط · +${syl} $SYL`,
  unlockedEndStatus: "تم الفتح!",
  lockedEndStatus: (pts) => `يفتح عند الإتمام (+${pts} نقاط)`,
  tierLadderLine:
    "المستويات: برونزي (5) · فضي (40) · ذهبي (65) · بلاتيني (95) · ألماسي (130) · زمردي (175)",
  midExamLabel: (day) => `1. اختبار المنتصف (اليوم ${day})`,
  finalExamLabel: (day) => `2. الاختبار النهائي (اليوم ${day})`,
  certSidebarLabel: "3. شهادة البلوكشين و $SYL",
  passedScore: (score) => `ناجح · الدرجة ${score}/100`,
  readyToTakeExam: "جاهز للبدء (5 اختيار + 2 مقالي)",
  lockedExamPriorDays: (maxDay) => `مقفل (أكمل الأيام 1-${maxDay})`,
  mintedStatus: (id) => `تم الإصدار (${id})`,
  readyToClaimCert: "جاهز للاستلام على Base Sepolia!",
  previewOnChainCert: "عرض الشهادة على البلوكشين و $SYL",
  studyProofTitle: "إثبات الدراسة",
  walletConnected: "المحفظة متصلة",
  optionalTag: "اختياري",
  studyProofDesc: "احفظ لقطة مشفرة غير قابلة للتعديل لخطة دراستك على البلوكشين.",
  openProgressProof: "فتح إثبات التقدم",
  lowRiskTitle: "خطر إرهاق منخفض",
  lowRiskDesc: "وتيرة الدراسة متوازنة مع توزيع صحي للعبء الذهني.",
  modRiskTitle: "خطر إرهاق متوسط",
  modRiskDesc: "الحمل الدراسي مكثف نسبيًا. حافظ على الجلسات بحد أقصى 90 دقيقة.",
  highRiskTitle: "خطر إرهاق مرتفع",
  highRiskDesc: "احتمال مرتفع للإجهاد الدراسي. أضف أيام راحة أو عدّل التواريخ.",
  weeklyTarget: "الهدف الأسبوعي",
  hrsSuffix: "ساعات",
  scheduledRecovery: "أيام الراحة المجدولة",
  uploaderTitle: "أنشئ خطة دراسة ذكية بدون إرهاق",
  uploaderSubtitle:
    "تقوم وكلاء الذكاء الاصطناعي بتحليل ملف PPT أو المنهج إلى مهام يومية دقيقة مع معادلات LaTeX وملاحظات قراءة مخصصة.",
  pipelineBadge: "مسار 4 وكلاء ذكاء اصطناعي",
  tabPresets: "نماذج جاهزة",
  tabUploadFile: "رفع ملف PPT / PDF",
  tabPasteText: "لصق النص",
  selectSampleCourse: "اختر مقررًا تجريبيًا",
  syllabusDocLabel: "ارفع عرض شرائح (PPTX, PDF) أو منهجًا (DOCX, TXT)",
  dropzoneIdleTitle: "انقر أو اسحب المنهج أو الشرائح هنا",
  dropzoneLoadingTitle: "جارٍ استخراج نص المستند...",
  dropzoneFormatsHint: "يدعم رفع حتى 10 ملفات (.pdf و .docx و .pptx و .txt · حد أقصى 15 ميجابايت للملف)",
  dropzoneRemoveTitle: "إزالة الملف",
  pasteSyllabusLabel: "نص المنهج أو محتوى الشرائح",
  pastePlaceholder: "الصق محتوى الشرائح أو قائمة المواضيع أو متطلبات المقرر هنا...",
  courseTitleLabel: "اسم المقرر",
  courseTitlePlaceholder: "مثال: CS 161 الخوارزميات وهياكل البيانات",
  totalDurationLabel: "المدة الإجمالية للدراسة",
  customDurationHint: (days) => `مدة مخصصة من 1 إلى 60 ${days}`,
  maxDailyLimitLabel: "الحد الأقصى للدراسة اليومية",
  hardCapHint: "بحد أقصى صارم 150 دقيقة/يوم",
  pacingPrefsLabel: "تفضيلات الوتيرة",
  includeRestDaysLabel: "تضمين أيام راحة أسبوعية",
  restDaysHint: "تعافٍ نشط للحفاظ على التركيز",
  liveExecutionTitle: "تشغيل الوكلاء المتعددين مباشرة",
  agent1Label: "الوكيل 1: مستخرج الشرائح والمنهج",
  agent1Detail: "استخراج الشرائح والوحدات والمفاهيم التقنية الأساسية",
  agent2Label: "الوكيل 2 و 4: مخطط المهام ومعادلات LaTeX",
  agent2Detail: "بناء خطوات يومية متوافقة مع الشرائح وصيغ LaTeX",
  agent3Label: "الوكيل 3: منسق القراءة والمراجع",
  agent3Detail: "إعداد أدلة قراءة من الشرائح وأوراق بحثية مفتوحة الوصول",
  validatorActive: "المدقق التسلسلي لمهام 15-30 دقيقة يوميًا نشط",
  runningAgentsBtn: "جارٍ تشغيل الوكلاء...",
  launchPipelineBtn: "تشغيل الوكلاء وبناء الخطة",
  materialsHeaderTitle: "مواد القراءة الذكية وملاحظات الشرائح المطابقة لملفك",
  materialsHeaderDesc:
    "ملاحظات قراءة معمقة أنشأها Gemini AI مباشرة من شرائح PPT المرفوعة، مدعومة بمعادلات LaTeX وأبحاث OpenAlex.",
  syncMaterialsBtn: "تحديث مواد القراءة من PPT",
  syncingMaterialsBtn: "الذكاء الاصطناعي يحلل العرض...",
  section1Title: (count) => `1. دليل القراءة الذكي ومعادلات الشرائح (${count} وحدات)`,
  section1Badge: "مُولّد من الشرائح",
  searchPaperBtn: "ابحث عن أوراق مرتبطة",
  section2Title: "2. أبحاث مفتوحة الوصول (OpenAlex) وموسوعة المفاهيم",
  verifiedSourcesCount: (count) => `${count} مصادر موثقة`,
  aiNotesBadge: "دليل قراءة AI من الشرائح",
  openAlexBadge: "بحث مفتوح الوصول OpenAlex",
  wikiBadge: "مرجع مفاهيمي",
  emptyMaterialsSyncing: "يقوم الوكيل 3 بإعداد أدلة القراءة وجلب الأبحاث المطابقة لملفك...",
  emptyMaterialsIdle: "انقر على «تحديث مواد القراءة من PPT» أعلاه لتوليد الشروحات المطابقة.",
};

const ES_COPY: WorkspaceCopy = {
  activeStudyPlan: "Plan de Estudio Activo",
  exportCalendar: "Exportar Calendario",
  exportedIcs: "Exportado (.ics)",
  fallingBehind: "Voy Atrasado",
  newPlan: "Nuevo Plan",
  tierExchangeNav: "Canje de Niveles y $SYL",
  tierExchangeMobileNav: "Canje de Certificados (Bronce+) y $SYL",
  tabTimeline: "Plan Diario de Estudio",
  tabCertificate: "Certificado y Monedas $SYL",
  tabMaterials: "Materiales de Lectura",
  tabProofs: "Prueba de Progreso",
  dayLabel: (day) => `Día ${day}`,
  doneCount: (done, total) => `${done}/${total} listo`,
  restDayBadge: "Descanso y Equilibrio",
  restDayDesc:
    "Día de Recuperación Cognitiva · Intervalo programado para prevenir el agotamiento.",
  sequentialLockBadge: "Bloqueo Secuencial",
  nextDayWaitBadge: (dateLabel) => `Se abre el ${dateLabel}`,
  lockedUntilTomorrowReason: (dateLabel) =>
    `Bloqueado hasta ${dateLabel} — Espera al día programado para mantener un ritmo constante día a día.`,
  lockedPriorDayReason: (prevDay) =>
    `Bloqueado — Completa primero todas las tareas del Día ${prevDay} en orden secuencial.`,
  lockedMidExamReason: (midDay, currentDay) =>
    `Bloqueado — Completa y aprueba el Examen Parcial (5 test + 2 ensayos) después del Día ${midDay} para desbloquear el Día ${currentDay}.`,
  breakdownStepsLabel: (done, total) => `Pasos Detallados (${done}/${total})`,
  focusBtn: "Enfoque",
  lockedBtn: "Bloqueado",
  showingDaysProgress: (visible, total) =>
    `Mostrando ${visible} de ${total} días — Desplázate o haz clic para ver más`,
  seqExamsCertTitle: "Exámenes Secuenciales y Certificado",
  pptWeightBadge: (pts) => `Peso PPT: ${pts}/5 Pts`,
  earnedSummary: (pts, syl) => `+${pts} Pts · +${syl} $SYL`,
  unlockedEndStatus: "¡Desbloqueado!",
  lockedEndStatus: (pts) => `Se desbloquea al final (+${pts} Pts)`,
  tierLadderLine:
    "Niveles: Bronce (5) · Plata (40) · Oro (65) · Platino (95) · Diamante (130) · Esmeralda (175)",
  midExamLabel: (day) => `1. Examen Parcial (Día ${day})`,
  finalExamLabel: (day) => `2. Examen Final (Día ${day})`,
  certSidebarLabel: "3. Certificado Blockchain y $SYL",
  passedScore: (score) => `Aprobado · Nota ${score}/100`,
  readyToTakeExam: "Listo para rendir (5 test + 2 ensayos)",
  lockedExamPriorDays: (maxDay) => `Bloqueado (Completa Días 1-${maxDay})`,
  mintedStatus: (id) => `Emitido (${id})`,
  readyToClaimCert: "¡Listo para reclamar en Base Sepolia!",
  previewOnChainCert: "Ver Certificado On-Chain y $SYL",
  studyProofTitle: "Prueba de Estudio",
  walletConnected: "Billetera Conectada",
  optionalTag: "Opcional",
  studyProofDesc:
    "Guarda una instantánea criptográfica inmutable de este plan en blockchain.",
  openProgressProof: "Abrir Prueba de Progreso",
  lowRiskTitle: "Riesgo Bajo de Agotamiento",
  lowRiskDesc:
    "El ritmo es sostenible con una carga cognitiva bien distribuida.",
  modRiskTitle: "Riesgo Moderado de Agotamiento",
  modRiskDesc:
    "La carga tiene tramos densos. Limita las sesiones a un máximo de 90 min.",
  highRiskTitle: "Riesgo Alto de Agotamiento",
  highRiskDesc:
    "Alta probabilidad de fatiga académica. Añade días de descanso o ajusta fechas.",
  weeklyTarget: "Meta Semanal",
  hrsSuffix: "h",
  scheduledRecovery: "Descanso Programado",
  uploaderTitle: "Generar Ruta de Estudio Anti-Agotamiento",
  uploaderSubtitle:
    "Agentes de IA especializados dividen tu PPT o temario en micro-tareas específicas por diapositiva con fórmulas LaTeX y lecturas.",
  pipelineBadge: "Pipeline de 4 Agentes",
  tabPresets: "Cursos de Ejemplo",
  tabUploadFile: "Subir PPT / PDF",
  tabPasteText: "Pegar Texto",
  selectSampleCourse: "Selecciona un Curso de Ejemplo",
  syllabusDocLabel: "Sube Diapositivas (PPTX, PDF) o Temario (DOCX, TXT)",
  dropzoneIdleTitle: "Haz clic o arrastra tu temario / presentación aquí",
  dropzoneLoadingTitle: "Extrayendo texto del documento...",
  dropzoneFormatsHint: "Admite hasta 10 archivos (.pdf, .docx, .pptx, .txt · máx. 15 MB c/u)",
  dropzoneRemoveTitle: "Eliminar archivo",
  pasteSyllabusLabel: "Texto del Temario o Diapositivas",
  pastePlaceholder:
    "Pega aquí tus diapositivas, lista de temas o requisitos del curso...",
  courseTitleLabel: "Título del Curso",
  courseTitlePlaceholder: "ej. CS 161 Algoritmos y Estructuras",
  totalDurationLabel: "Duración Total del Estudio",
  customDurationHint: (days) => `Duración personalizada de 1 a 60 ${days}`,
  maxDailyLimitLabel: "Límite Diario de Estudio",
  hardCapHint: "Tope máximo de 150 min/día",
  pacingPrefsLabel: "Preferencias de Ritmo",
  includeRestDaysLabel: "Incluir días semanales de descanso",
  restDaysHint: "Recuperación activa para mantener el enfoque",
  liveExecutionTitle: "Ejecución Multi-Agente en Vivo",
  agent1Label: "Agente 1: Extractor de Diapositivas y Temario",
  agent1Detail: "Extrayendo módulos, conceptos técnicos y fórmulas clave",
  agent2Label: "Agentes 2 y 4: Planificador de Tareas y LaTeX",
  agent2Detail: "Construyendo pasos diarios específicos con notación LaTeX",
  agent3Label: "Agente 3: Curador de Lecturas y Artículos",
  agent3Detail: "Sintetizando guías de IA y artículos Open-Access del PPT",
  validatorActive: "Validador secuencial de 15–30 min diarios activo",
  runningAgentsBtn: "Ejecutando Agentes...",
  launchPipelineBtn: "Iniciar Pipeline de Agentes",
  materialsHeaderTitle:
    "Materiales de Lectura IA y Notas Adaptadas a tu PPT",
  materialsHeaderDesc:
    "Notas de estudio generadas por Gemini AI directamente desde tus diapositivas, con fórmulas LaTeX y artículos OpenAlex.",
  syncMaterialsBtn: "Resincronizar Materiales desde el PPT",
  syncingMaterialsBtn: "Analizando PPT con IA...",
  section1Title: (count) =>
    `1. Guía de Lectura IA y Fórmulas (${count} Módulos)`,
  section1Badge: "Generado desde el PPT",
  searchPaperBtn: "Buscar Artículos Relacionados",
  section2Title:
    "2. Artículos Open-Access (OpenAlex) y Enciclopedia Conceptual",
  verifiedSourcesCount: (count) => `${count} fuentes verificadas`,
  aiNotesBadge: "Guía IA del PPT",
  openAlexBadge: "Artículo Open-Access OpenAlex",
  wikiBadge: "Referencia Conceptual",
  emptyMaterialsSyncing:
    "El Agente 3 está generando guías de lectura y buscando artículos Open-Access...",
  emptyMaterialsIdle:
    "Haz clic en 'Resincronizar Materiales desde el PPT' para generar las lecturas.",
};

const PT_COPY: WorkspaceCopy = {
  activeStudyPlan: "Plano de Estudo Ativo",
  exportCalendar: "Exportar Calendário",
  exportedIcs: "Exportado (.ics)",
  fallingBehind: "Estou Atrasado",
  newPlan: "Novo Plano",
  tierExchangeNav: "Troca de Níveis e $SYL",
  tierExchangeMobileNav: "Troca de Certificados (Bronze+) e $SYL",
  tabTimeline: "Plano Diário de Estudos",
  tabCertificate: "Certificado e Moedas $SYL",
  tabMaterials: "Materiais de Leitura",
  tabProofs: "Prova de Progresso",
  dayLabel: (day) => `Dia ${day}`,
  doneCount: (done, total) => `${done}/${total} concluído`,
  restDayBadge: "Descanso e Equilíbrio",
  restDayDesc:
    "Dia de Recuperação Cognitiva · Intervalo programado para evitar esgotamento.",
  sequentialLockBadge: "Bloqueio Sequencial",
  nextDayWaitBadge: (dateLabel) => `Libera em ${dateLabel}`,
  lockedUntilTomorrowReason: (dateLabel) =>
    `Bloqueado até ${dateLabel} — Aguarde o próximo dia programado para manter o ritmo diário constante.`,
  lockedPriorDayReason: (prevDay) =>
    `Bloqueado — Conclua primeiro todas as tarefas do Dia ${prevDay} em ordem sequencial.`,
  lockedMidExamReason: (midDay, currentDay) =>
    `Bloqueado — Conclua e passe no Exame Intermediário (5 múltipla + 2 dissertativas) após o Dia ${midDay} para liberar o Dia ${currentDay}.`,
  breakdownStepsLabel: (done, total) => `Etapas Detalhadas (${done}/${total})`,
  focusBtn: "Focar",
  lockedBtn: "Bloqueado",
  showingDaysProgress: (visible, total) =>
    `Exibindo ${visible} de ${total} dias — Role ou clique para ver mais`,
  seqExamsCertTitle: "Exames Sequenciais e Certificado",
  pptWeightBadge: (pts) => `Peso PPT: ${pts}/5 Pts`,
  earnedSummary: (pts, syl) => `+${pts} Pts · +${syl} $SYL`,
  unlockedEndStatus: "Desbloqueado!",
  lockedEndStatus: (pts) => `Libera ao concluir (+${pts} Pts)`,
  tierLadderLine:
    "Níveis: Bronze (5) · Prata (40) · Ouro (65) · Platina (95) · Diamante (130) · Esmeralda (175)",
  midExamLabel: (day) => `1. Exame Intermediário (Dia ${day})`,
  finalExamLabel: (day) => `2. Exame Final (Dia ${day})`,
  certSidebarLabel: "3. Certificado Blockchain e $SYL",
  passedScore: (score) => `Aprovado · Nota ${score}/100`,
  readyToTakeExam: "Pronto para fazer (5 múltipla + 2 dissertativas)",
  lockedExamPriorDays: (maxDay) => `Bloqueado (Conclua Dias 1-${maxDay})`,
  mintedStatus: (id) => `Emitido (${id})`,
  readyToClaimCert: "Pronto para resgatar na Base Sepolia!",
  previewOnChainCert: "Ver Certificado On-Chain e $SYL",
  studyProofTitle: "Prova de Estudo",
  walletConnected: "Carteira Conectada",
  optionalTag: "Opcional",
  studyProofDesc:
    "Salve um snapshot criptográfico imutável deste plano na blockchain.",
  openProgressProof: "Abrir Prova de Progresso",
  lowRiskTitle: "Baixo Risco de Esgotamento",
  lowRiskDesc:
    "O ritmo é sustentável com distribuição equilibrada da carga cognitiva.",
  modRiskTitle: "Risco Moderado de Esgotamento",
  modRiskDesc:
    "A carga tem trechos densos. Mantenha sessões limitadas a 90 minutos.",
  highRiskTitle: "Alto Risco de Esgotamento",
  highRiskDesc:
    "Alta probabilidade de exaustão acadêmica. Inclua dias de descanso ou ajuste datas.",
  weeklyTarget: "Meta Semanal",
  hrsSuffix: "h",
  scheduledRecovery: "Descanso Programado",
  uploaderTitle: "Gerar Roteiro de Estudos Anti-Esgotamento",
  uploaderSubtitle:
    "Agentes de IA especializados dividem seu PPT ou ementa em micro-tarefas específicas por slide com fórmulas LaTeX e notas de leitura.",
  pipelineBadge: "Pipeline de 4 Agentes",
  tabPresets: "Cursos de Exemplo",
  tabUploadFile: "Enviar PPT / PDF",
  tabPasteText: "Colar Texto",
  selectSampleCourse: "Selecione um Curso de Exemplo",
  syllabusDocLabel: "Envie Slides (PPTX, PDF) ou Ementa (DOCX, TXT)",
  dropzoneIdleTitle: "Clique ou arraste sua ementa / slides aqui",
  dropzoneLoadingTitle: "Extraindo texto do documento...",
  dropzoneFormatsHint: "Suporta até 10 arquivos (.pdf, .docx, .pptx, .txt · máx. 15 MB cada)",
  dropzoneRemoveTitle: "Remover arquivo",
  pasteSyllabusLabel: "Texto da Ementa ou Conteúdo dos Slides",
  pastePlaceholder:
    "Cole aqui seus slides, lista de tópicos ou especificações do curso...",
  courseTitleLabel: "Título do Curso",
  courseTitlePlaceholder: "ex. CS 161 Algoritmos e Estruturas",
  totalDurationLabel: "Duração Total do Estudo",
  customDurationHint: (days) => `Duração personalizada de 1 a 60 ${days}`,
  maxDailyLimitLabel: "Limite Diário de Estudo",
  hardCapHint: "Limite máximo de 150 min/dia",
  pacingPrefsLabel: "Preferências de Ritmo",
  includeRestDaysLabel: "Incluir dias semanais de descanso",
  restDaysHint: "Recuperação ativa para manter o foco",
  liveExecutionTitle: "Execução Multi-Agente ao Vivo",
  agent1Label: "Agente 1: Extrator de Slides e Ementa",
  agent1Detail: "Extraindo slides, módulos e conceitos técnicos principais",
  agent2Label: "Agentes 2 e 4: Planejador de Tarefas e LaTeX",
  agent2Detail: "Montando etapas diárias específicas com notação LaTeX",
  agent3Label: "Agente 3: Curador de Leitura e Artigos",
  agent3Detail: "Sintetizando guias de IA e artigos Open-Access do PPT",
  validatorActive: "Validador sequencial diário de 15–30 min ativo",
  runningAgentsBtn: "Executando Agentes...",
  launchPipelineBtn: "Iniciar Pipeline de Agentes",
  materialsHeaderTitle:
    "Materiais de Leitura IA e Notas Alinhadas ao seu PPT",
  materialsHeaderDesc:
    "Notas de estudo aprofundadas geradas pelo Gemini AI diretamente dos seus slides, com fórmulas LaTeX e artigos OpenAlex.",
  syncMaterialsBtn: "Ressincronizar Materiais do PPT",
  syncingMaterialsBtn: "Analisando PPT com IA...",
  section1Title: (count) =>
    `1. Guia de Leitura IA e Fórmulas (${count} Módulos)`,
  section1Badge: "Gerado por IA do PPT",
  searchPaperBtn: "Buscar Artigos Relacionados",
  section2Title:
    "2. Artigos Open-Access (OpenAlex) e Enciclopédia de Conceitos",
  verifiedSourcesCount: (count) => `${count} itens verificados`,
  aiNotesBadge: "Guia IA do PPT",
  openAlexBadge: "Artigo Open-Access OpenAlex",
  wikiBadge: "Referência Conceitual",
  emptyMaterialsSyncing:
    "O Agente 3 está gerando guias de leitura e buscando artigos Open-Access...",
  emptyMaterialsIdle:
    "Clique em 'Ressincronizar Materiais do PPT' acima para gerar as leituras.",
};

const COPY_BY_LANG: Record<AppLanguage, WorkspaceCopy> = {
  en: EN_COPY,
  id: ID_COPY,
  zh: ZH_COPY,
  ar: AR_COPY,
  es: ES_COPY,
  pt: PT_COPY,
};

export function getWorkspaceCopy(lang: AppLanguage): WorkspaceCopy {
  return COPY_BY_LANG[lang] ?? EN_COPY;
}
