import React, { createContext, useCallback, useContext, useState } from "react";
import { AppLanguage, Roadmap } from "@/types/roadmap";

interface MobileUser {
  id: string;
  name: string;
  username: string;
  walletAddress?: string;
}

interface MobileStoreContextValue {
  user: MobileUser | null;
  language: AppLanguage;
  history: Roadmap[];
  activeRoadmap: Roadmap | null;
  signInDemo: (name: string, email: string) => void;
  signOut: () => void;
  setLanguage: (lang: AppLanguage) => void;
  addRoadmap: (roadmap: Roadmap) => void;
  selectRoadmap: (roadmapId: string) => void;
  toggleTaskCompletion: (taskId: string) => void;
  replaceActiveRoadmap: (roadmap: Roadmap) => void;
}

const MobileStoreContext = createContext<MobileStoreContextValue>({
  user: null,
  language: "en",
  history: [],
  activeRoadmap: null,
  signInDemo: () => {},
  signOut: () => {},
  setLanguage: () => {},
  addRoadmap: () => {},
  selectRoadmap: () => {},
  toggleTaskCompletion: () => {},
  replaceActiveRoadmap: () => {},
});

export function MobileStoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MobileUser | null>(null);
  const [language, setLanguage] = useState<AppLanguage>("en");
  const [history, setHistory] = useState<Roadmap[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeRoadmap =
    history.find((r) => r.id === activeId) ?? history[0] ?? null;

  const signInDemo = useCallback((name: string, email: string) => {
    const cleanName = name.trim() || "Scholar";
    const handle = email.includes("@") ? email.split("@")[0] : cleanName.toLowerCase();
    setUser({
      id: `USR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      name: cleanName,
      username: `@${handle}`,
    });
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
  }, []);

  const addRoadmap = useCallback((roadmap: Roadmap) => {
    setHistory((prev) => [roadmap, ...prev.filter((item) => item.id !== roadmap.id)]);
    setActiveId(roadmap.id);
  }, []);

  const selectRoadmap = useCallback((roadmapId: string) => {
    setActiveId(roadmapId);
  }, []);

  const replaceActiveRoadmap = useCallback((updated: Roadmap) => {
    setHistory((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    setActiveId(updated.id);
  }, []);

  const toggleTaskCompletion = useCallback((taskId: string) => {
    setHistory((prev) =>
      prev.map((rm) => {
        const isTarget = rm.dailySchedules.some((d) =>
          d.tasks.some((t) => t.id === taskId)
        );
        if (!isTarget) return rm;

        let completedCount = 0;
        const nextSchedules = rm.dailySchedules.map((day) => ({
          ...day,
          tasks: day.tasks.map((task) => {
            const nextDone =
              task.id === taskId ? !task.isCompleted : task.isCompleted;
            if (nextDone) completedCount++;
            return { ...task, isCompleted: nextDone };
          }),
        }));

        return {
          ...rm,
          completedTasks: completedCount,
          dailySchedules: nextSchedules,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  return (
    <MobileStoreContext.Provider
      value={{
        user,
        language,
        history,
        activeRoadmap,
        signInDemo,
        signOut,
        setLanguage,
        addRoadmap,
        selectRoadmap,
        toggleTaskCompletion,
        replaceActiveRoadmap,
      }}
    >
      {children}
    </MobileStoreContext.Provider>
  );
}

export function useMobileStore() {
  return useContext(MobileStoreContext);
}
