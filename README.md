# Syllaba - AI Study & Task Roadmap Generator

Syllaba is an academic task breakdown engine designed to help students overcome academic fatigue and procrastination. It decomposes dense course syllabi and multi-week assignment guidelines into structured, low-friction daily micro-milestones with automated cognitive load pacing.

## Features

- **Document Ingestion**: Upload course syllabi or assignment prompts as PDF or plain text, or select from built-in academic presets.
- **AI Task Decomposition**: Breaks complex multi-week deliverables into daily tasks (30 to 75 minutes) with actionable subtasks.
- **Anti-Burnout Pacing Engine**: Evaluates weekly peak hours, caps daily study volume, and embeds mandatory cognitive recovery days.
- **Cognitive Load Profiling**: Classifies each task into Light, Moderate, or Deep Focus categories.
- **Interactive Execution**: In-app task checklist with real-time progress calculations.
- **Focus Timer**: Integrated Pomodoro session modal with audio completion alerts.
- **Dynamic Rescheduling**: "I'm Falling Behind" timeline recalibration to shift remaining tasks across your calendar without guilt.
- **Calendar Integration**: Export generated study plans directly into standard `.ics` format compatible with Google Calendar, Apple Calendar, and Microsoft Outlook.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS (UI/UX Pro Max design tokens)
- **Icons**: Lucide React
- **AI Model**: Google Gemini (gemini-2.5-flash)
- **Storage**: Supabase client with local browser storage cache
- **Deployment**: Vercel ready

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd syllaba
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Add your Gemini API key in `.env.local`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Build

```bash
npm run build
npm start
```
