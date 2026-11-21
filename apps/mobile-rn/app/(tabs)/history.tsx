import React, { useCallback } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { ArrowRight, BookOpen } from "lucide-react-native";
import { COLORS } from "@/theme/tokens";
import { useMobileStore } from "@/context/MobileStoreContext";
import { Roadmap } from "@/types/roadmap";

export default function HistoryScreen() {
  const router = useRouter();
  const { history, activeRoadmap, language, selectRoadmap } = useMobileStore();
  const isId = language === "id";

  const handleOpen = useCallback(
    (roadmapId: string) => {
      selectRoadmap(roadmapId);
      router.push("/");
    },
    [router, selectRoadmap]
  );

  const renderItem = useCallback(
    ({ item }: { item: Roadmap }) => {
      const pct =
        item.totalTasks > 0
          ? Math.round((item.completedTasks / item.totalTasks) * 100)
          : 0;
      const isActive = activeRoadmap?.id === item.id;

      return (
        <Pressable
          onPress={() => handleOpen(item.id)}
          style={[styles.card, isActive ? styles.cardActive : null]}
        >
          <View style={styles.cardTop}>
            <Text style={styles.courseTitle} numberOfLines={1}>
              {item.courseTitle}
            </Text>
            <Text style={styles.pctBadge}>{pct}%</Text>
          </View>
          <Text style={styles.metaText}>
            {item.completedTasks}/{item.totalTasks}{" "}
            {isId ? "tugas" : "tasks"} · {item.totalDays}{" "}
            {isId ? "hari" : "days"}
          </Text>
          <View style={styles.openRow}>
            <Text style={styles.openLabel}>
              {isId ? "Buka Roadmap" : "Open Roadmap"}
            </Text>
            <ArrowRight size={14} color={COLORS.inkBlack} />
          </View>
        </Pressable>
      );
    },
    [activeRoadmap?.id, handleOpen, isId]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.heading}>
          {isId ? "Riwayat Roadmap" : "Study History"}
        </Text>
        <FlashList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          estimatedItemSize={110}
          contentInsetAdjustmentBehavior="automatic"
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <BookOpen size={28} color={COLORS.muted} />
              <Text style={styles.emptyText}>
                {isId
                  ? "Belum ada riwayat roadmap di sesi ini."
                  : "No roadmaps generated yet in this session."}
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
    paddingTop: 14,
  },
  heading: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.inkBlack,
    marginBottom: 14,
  },
  card: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
    gap: 6,
  },
  cardActive: {
    borderColor: COLORS.inkBlack,
    backgroundColor: COLORS.surfaceGlass,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  courseTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.inkBlack,
  },
  pctBadge: {
    backgroundColor: COLORS.yellowPrimary,
    color: COLORS.inkBlack,
    fontSize: 11,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.muted,
  },
  openRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  openLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.inkBlack,
  },
  emptyBox: {
    paddingVertical: 48,
    alignItems: "center",
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: "center",
  },
});
