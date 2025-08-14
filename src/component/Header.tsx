import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Header({ onMenuPress, onProfilePress }: { onMenuPress: () => void, onProfilePress: () => void }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={onMenuPress}>
          <Ionicons name="menu" size={40} color="black" />
        </TouchableOpacity>

        <Image
          source={require("../../assets/images/hertsu_logo.png")}
          style={styles.logo}
        />

        <TouchableOpacity onPress={onProfilePress}>
          <Ionicons name="person-circle-outline" size={40} color="black" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#fff" },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "white",
  },
  logo: {
    width: 130,
    height: 40,
    resizeMode: "contain",
  },
});
