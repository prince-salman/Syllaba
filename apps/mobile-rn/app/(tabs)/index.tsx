import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { Sparkles, RefreshCw } from "lucide-react-native";
import { COLORS } from "@/theme/tokens";
import { useMobileStore } from "@/context/MobileStoreContext";
import {
  generateMobileRoadmap,
  rescheduleMobileRoadmap,
} from "@/services/syllabaApi";
import { TaskRow } from "@/components/TaskRow";
import { RoadmapTask } from "@/types/roadmap";

const SAMPLE_SYLLABUS = `Course: CS402 Distributed Systems & Web3 Consensus
Week 1: CAP Theorem, Logical Clocks, Lamport Timestamps
Week 2: Raft Consensus & Leader Election
Week 3: EVM Execution, Reentrancy Guards & State Proofs`;

export default function DashboardScreen() {
  const {
    user,
    language,
    activeRoadmap,
    addRoadmap,
    toggleTaskCompletion,
    replaceActiveRoadmap,
  } = useMobileStore();
  const isId = language === "id";

  const [syllabusInput, setSyllabusInput] = useState(SAMPLE_SYLLABUS);
  const [stageText, setStageText] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const flatTasks = useMemo<RoadmapTask[]>(() => {
    if (!activeRoadmap) return [];
    return activeRoadmap.dailySchedules.flatMap((d) => d.tasks);
  }, [activeRoadmap]);

  const handleGenerate = useCallback(async () => {
    if (!syllabusInput.trim()) return;
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const roadmap = await generateMobileRoadmap(
        syllabusInput,
        { dailyHoursLimit: 2 },
        (stage) => {
          if (stage === "extract") setStageText("Agent 1: Extracting modules...");
          if (stage === "plan") setStageText("Agent 2 & 4: Planning 15-30m tasks...");
          if (stage === "curate") setStageText("Agent 3: Curating OpenAlex papers...");
        }
      );
      addRoadmap(roadmap);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to generate roadmap."
      );
    } finally {
      setIsGenerating(false);
      setStageText(null);
    }
  }, [addRoadmap, syllabusInput]);

  const handleReschedule = useCallback(async () => {
    if (!activeRoadmap) return;
    setIsGenerating(true);
    setStageText(isId ? "Menata ulang jadwal..." : "Recalculating schedule...");
    try {
      const updated = await rescheduleMobileRoadmap(activeRoadmap, 2);
      replaceActiveRoadmap(updated);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Could not reschedule roadmap."
      );
    } finally {
      setIsGenerating(false);
      setStageText(null);
    }
  }, [activeRoadmap, isId, replaceActiveRoadmap]);

  const handleToggleTask = useCallback(
    (taskId: string) => {
      toggleTaskCompletion(taskId);
    },
    [toggleTaskCompletion]
  );

  const renderTaskItem = useCallback(
    ({ item }: { item: RoadmapTask }) => (
      <TaskRow task={item} onToggle={handleToggleTask} />
    ),
    [handleToggleTask]
  );

  const keyExtractor = useCallback((item: RoadmapTask) => item.id, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Floating Frameless Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Image
              source={require("../../assets/syllaba-mark.png")}
              style={styles.logo}
              contentFit="contain"
            />
            <View>
              <Text style={styles.brandTitle}>Syllaba</Text>
              <Text style={styles.brandSub}>
                {user ? `${user.name} · ${user.username}` : "AI Study Planner"}
              </Text>
            </View>
          </View>
          <View style={styles.chainBadge}>
            <Text style={styles.chainText}>Base Sepolia</Text>
          </View>
        </View>

        <FlashList
          data={flatTasks}
          renderItem={renderTaskItem}
          keyExtractor={keyExtractor}
          estimatedItemSize={106}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              {/* Generator Card */}
              <View style={styles.heroCard}>
                <View style={styles.pillRow}>
                  <Sparkles size={14} color={COLORS.yellowPrimary} />
                  <Text style={styles.pillText}>5-Agent Pipeline</Text>
                </View>
                <Text style={styles.heroTitle}>
                  {isId
                    ? "Ubah Silabus Menjadi Micro-Task 15-30 Menit"
                    : "Turn Syllabi Into 15-30m Daily Sprints"}
                </Text>

                <TextInput
                  multiline
                  value={syllabusInput}
                  onChangeText={setSyllabusInput}
                  placeholder="Paste syllabus topics..."
                  placeholderTextColor={COLORS.muted}
                  style={styles.input}
                />

                {errorMsg ? (
                  <Text style={styles.errorText}>{errorMsg}</Text>
                ) : null}

                <Pressable
                  onPress={handleGenerate}
                  disabled={isGenerating}
                  style={styles.primaryBtn}
                >
                  {isGenerating ? (
                    <ActivityIndicator size="small" color={COLORS.inkBlack} />
                  ) : null}
                  <Text style={styles.primaryBtnText}>
                    {isGenerating
                      ? stageText || "Running Agents..."
                      : isId
                      ? "Buat Roadmap Belajar"
                      : "Generate Verified Roadmap"}
                  </Text>
                </Pressable>
              </View>

              {activeRoadmap ? (
                <View style={styles.kpiSection}>
                  <View style={styles.kpiRow}>
                    <View style={[styles.kpiCard, styles.kpiBlack]}>
                      <Text style={styles.kpiLabelWhite}>
                        {isId ? "Selesai" : "Completed"}
                      </Text>
                      <Text style={styles.kpiValueYellow}>
                        {activeRoadmap.completedTasks}/{activeRoadmap.totalTasks}
                      </Text>
                    </View>
                    <View style={styles.kpiCard}>
                      <Text style={styles.kpiLabel}>Burnout Risk</Text>
                      <Text style={styles.kpiValue}>
                        {activeRoadmap.burnoutMetrics.riskLevel.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle} numberOfLines={1}>
                      {activeRoadmap.courseTitle}
                    </Text>
                    <Pressable
                      onPress={handleReschedule}
                      style={styles.rescheduleBtn}
                    >
                      <RefreshCw size={13} color={COLORS.inkBlack} />
                      <Text style={styles.rescheduleText}>
                        {isId ? "Atur Ulang" : "Catch Up"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                {isId
                  ? "Tekan tombol Buat Roadmap di atas untuk memulai."
                  : "Tap Generate Verified Roadmap above to inspect your 15-30m sprints."}
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 34,
    height: 34,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.inkBlack,
  },
  brandSub: {
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: "600",
  },
  chainBadge: {
    backgroundColor: COLORS.yellowSoft,
    borderColor: COLORS.yellowBorder,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  chainText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.yellowDarkText,
  },
  listHeader: {
    paddingBottom: 8,
  },
  heroCard: {
    backgroundColor: COLORS.inkBlack,
    borderRadius: 20,
    padding: 16,
    gap: 10,
    marginBottom: 14,
  },
  pillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.yellowPrimary,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.white,
    lineHeight: 24,
  },
  input: {
    backgroundColor: COLORS.charcoal,
    borderRadius: 12,
    padding: 12,
    color: COLORS.white,
    fontSize: 12,
    minHeight: 84,
    textAlignVertical: "top",
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 12,
    fontWeight: "600",
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.yellowPrimary,
    borderRadius: 12,
    paddingVertical: 12,
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.inkBlack,
  },
  kpiSection: {
    gap: 12,
    marginBottom: 6,
  },
  kpiRow: {
    flexDirection: "row",
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 14,
  },
  kpiBlack: {
    backgroundColor: COLORS.inkBlack,
    borderColor: COLORS.inkBlack,
  },
  kpiLabelWhite: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.yellowSoft,
  },
  kpiValueYellow: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.yellowPrimary,
    marginTop: 4,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.muted,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.inkBlack,
    marginTop: 6,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.inkBlack,
  },
  rescheduleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.yellowSoft,
    borderWidth: 1,
    borderColor: COLORS.yellowBorder,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  rescheduleText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.inkBlack,
  },
  emptyBox: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: "center",
  },
});
