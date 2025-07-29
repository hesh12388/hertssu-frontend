import { Link } from "expo-router";
import { SafeAreaView, StyleSheet, Text } from "react-native";


export default function Index() {
  return (
    <SafeAreaView
      style ={styles.container}
    >
      <Text style = {styles.text}>Hello 3</Text>
      <Link href="/auth/login">Login</Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'blue',
    height: '100%'
  },
  text: {
    fontSize: 40,
    color: 'white'
  }
});
