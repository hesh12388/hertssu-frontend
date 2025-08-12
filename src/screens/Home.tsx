import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
const Home = ({navigation} : {navigation:any}) => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.navBar}>
                {/* Hamburger Icon */}
                <TouchableOpacity onPress={() => navigation.openDrawer()}>
                    <Ionicons name="menu" size={45} color="black" />
                </TouchableOpacity>

                {/* Hertssu Logo */}
                <Image
                    source={require("../../assets/images/hertsu_logo.png")}
                    style={styles.logo}
                />
                {/* Profile Icon */}
                <TouchableOpacity>
                    <Ionicons name="person-circle-outline" size={45} color="black" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        flex: 1,
    },
    navBar:{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        backgroundColor: 'white',
    },
    logo:{
        width: 130,
        height: 40,
        resizeMode: 'contain',
    },
});
export default Home;