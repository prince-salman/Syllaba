import React, { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Globe, HelpCircle, LogIn, LogOut, User } from "lucide-react-native";
import { COLORS } from "@/theme/tokens";
import { useMobileStore } from "@/context/MobileStoreContext";

export default function SettingsScreen() {
  const { user, language, signInDemo, signOut, setLanguage } = useMobileStore();
  const isId = language === "id";

  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");

  const handleLogin = () => {
    signInDemo(nameInput || "Scholar", emailInput || "scholar@syllaba.xyz");
    setNameInput("");
    setEmailInput("");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.container}
      >
        <Text style={styles.heading}>
          {isId ? "Pengaturan & Akun" : "Setting & Account"}
        </Text>

        {/* Glassy Profile Summary */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name || "S").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user ? `${user.name} (${user.id})` : "Guest Scholar"}
            </Text>
            <Text style={styles.profileHandle}>
              {user ? user.username : "Sign in to sync across devices"}
            </Text>
          </View>
        </View>

        {/* 1. Login (when logged out) or Account */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <User size={16} color={COLORS.inkBlack} />
            <Text style={styles.cardTitle}>Account</Text>
          </View>

          {user ? (
            <View style={styles.accountBody}>
              <Text style={styles.bodyText}>
                {isId ? "Masuk sebagai " : "Signed in as "}
                {user.name} ({user.username})
              </Text>
              <Pressable onPress={signOut} style={styles.logoutBtn}>
                <LogOut size={15} color={COLORS.inkBlack} />
                <Text style={styles.logoutText}>Logout</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.accountBody}>
              <TextInput
                value={nameInput}
                onChangeText={setNameInput}
                placeholder={isId ? "Nama Lengkap" : "Full Name"}
                placeholderTextColor={COLORS.muted}
                style={styles.input}
              />
              <TextInput
                value={emailInput}
                onChangeText={setEmailInput}
                placeholder="you@syllaba.xyz"
                placeholderTextColor={COLORS.muted}
                autoCapitalize="none"
                style={styles.input}
              />
              <Pressable onPress={handleLogin} style={styles.loginBtn}>
                <LogIn size={15} color={COLORS.yellowPrimary} />
                <Text style={styles.loginText}>Login</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Language */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Globe size={16} color={COLORS.inkBlack} />
            <Text style={styles.cardTitle}>Language</Text>
          </View>

          <View style={styles.langRow}>
            <Pressable
              onPress={() => setLanguage("en")}
              style={[
                styles.langBtn,
                language === "en" ? styles.langBtnActive : null,
              ]}
            >
              <Text
                style={[
                  styles.langText,
                  language === "en" ? styles.langTextActive : null,
                ]}
              >
                English (EN)
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setLanguage("id")}
              style={[
                styles.langBtn,
                language === "id" ? styles.langBtnActive : null,
              ]}
            >
              <Text
                style={[
                  styles.langText,
                  language === "id" ? styles.langTextActive : null,
                ]}
              >
                Indonesia (ID)
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Help / Contact Us */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <HelpCircle size={16} color={COLORS.inkBlack} />
            <Text style={styles.cardTitle}>Help / Contact Us</Text>
          </View>
          <Text style={styles.bodyText}>
            Team ITSPIRIT · support@syllaba.xyz · https://syllaba.xyz
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  container: {
    padding: 16,
    gap: 12,
  },
  heading: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.inkBlack,
  },
  profileCard: {
    backgroundColor: COLORS.inkBlack,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: COLORS.yellowPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.inkBlack,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.white,
  },
  profileHandle: {
    fontSize: 12,
    color: COLORS.yellowSoft,
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 15,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.inkBlack,
  },
  accountBody: {
    gap: 10,
  },
  bodyText: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 19,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.inkBlack,
    backgroundColor: COLORS.surfaceGlass,
  },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.inkBlack,
    borderRadius: 12,
    paddingVertical: 11,
  },
  loginText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.yellowPrimary,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.yellowSoft,
    borderWidth: 1,
    borderColor: COLORS.yellowBorder,
    borderRadius: 12,
    paddingVertical: 11,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.inkBlack,
  },
  langRow: {
    flexDirection: "row",
    gap: 10,
  },
  langBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  langBtnActive: {
    backgroundColor: COLORS.inkBlack,
    borderColor: COLORS.inkBlack,
  },
  langText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.inkBlack,
  },
  langTextActive: {
    color: COLORS.yellowPrimary,
  },
});
