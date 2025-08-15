import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';


const NavBar = () => {
    const navigation = useNavigation();
    return (
        <View style={styles.navBar}>
            {/* Hamburger Icon */}
            <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
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
    )
}

const styles = StyleSheet.create({
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

export default NavBar;