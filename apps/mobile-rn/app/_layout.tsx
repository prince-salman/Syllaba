import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MobileStoreProvider } from "@/context/MobileStoreContext";

export default function RootLayout() {
  return (
    <MobileStoreProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </MobileStoreProvider>
  );
}
