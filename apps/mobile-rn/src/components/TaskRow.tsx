import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CheckCircle2, Circle, Clock } from "lucide-react-native";
import { RoadmapTask } from "@/types/roadmap";
import { COLORS } from "@/theme/tokens";

interface TaskRowProps {
  task: RoadmapTask;
  onToggle: (taskId: string) => void;
}

export const TaskRow = React.memo(function TaskRow({ task, onToggle }: TaskRowProps) {
  return (
    <Pressable
      onPress={() => onToggle(task.id)}
      style={({ pressed }) => [
        styles.card,
        task.isCompleted ? styles.cardDone : null,
        pressed ? styles.cardPressed : null,
      ]}
    >
      <View style={styles.row}>
        {task.isCompleted ? (
          <CheckCircle2 size={20} color={COLORS.inkBlack} />
        ) : (
          <Circle size={20} color={COLORS.muted} />
        )}

        <View style={styles.content}>
          <Text
            style={[styles.title, task.isCompleted ? styles.titleDone : null]}
            numberOfLines={2}
          >
            {task.title}
          </Text>
          {task.description ? (
            <Text style={styles.desc} numberOfLines={2}>
              {task.description}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <View style={styles.dayPill}>
              <Text style={styles.dayText}>Day {task.dayNumber}</Text>
            </View>
            <View style={styles.durationPill}>
              <Clock size={12} color={COLORS.yellowDarkText} />
              <Text style={styles.durationText}>{task.estimatedMinutes}m</Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
  },
  cardDone: {
    backgroundColor: COLORS.surfaceGlass,
    borderColor: COLORS.yellowBorder,
  },
  cardPressed: {
    opacity: 0.85,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  content: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.inkBlack,
  },
  titleDone: {
    textDecorationLine: "line-through",
    color: COLORS.muted,
  },
  desc: {
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 17,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  dayPill: {
    backgroundColor: COLORS.inkBlack,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  dayText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.yellowPrimary,
  },
  durationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.yellowSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  durationText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.yellowDarkText,
  },
});
