import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
const Interview = ({navigation}:{navigation:any}) => {

    const [isOnHistory, setIsOnHistory] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    const handleSearchIconPress = () => {
        setIsSearchExpanded(true);
    };

    const handleSearchBlur = () => {
        if (searchText === '') {
            setIsSearchExpanded(false);
        }
    };
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView keyboardShouldPersistTaps="handled">
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

                <View style={styles.header}>
                    <Text style={styles.headerText}>
                        {isOnHistory ? "Interview History" : "Upcoming Interviews"}
                    </Text>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity>
                            <Ionicons name="add-circle-outline" size={34} color='#E9435E' />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.optionsContainer}>
                    <View style={styles.options}>
                        <TouchableOpacity onPress={() => setIsOnHistory(false)} style={!isOnHistory ? styles.activeOption : {}}>
                            <Text style={isOnHistory ? styles.inactiveText: styles.activeText}>Upcoming</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setIsOnHistory(true)} style={isOnHistory ? styles.activeOption : {}}>
                            <Text style={isOnHistory ? styles.activeText: styles.inactiveText}>History</Text>
                        </TouchableOpacity>
                    </View>
                    {isSearchExpanded ? (
                        <TextInput
                            placeholder="Search..."
                            value={searchText}
                            onChangeText={setSearchText}
                            onBlur={handleSearchBlur}
                            style={styles.searchBar}
                            placeholderTextColor="#999"
                            autoFocus
                        />
                    ) : (
                        <TouchableOpacity onPress={handleSearchIconPress}>
                            <Ionicons name="search-outline" size={24} color="#666" />
                        </TouchableOpacity>
                    )}
                </View>
                <View>
                    
                </View>
            </ScrollView>
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
    headerText:{
        fontSize: 24,
        fontWeight: 'bold',
    },
    header:{
        flexDirection:"row",
        alignItems:'center',
        justifyContent: 'space-between',
        padding: 20,
    },
    headerLeft:{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    activeText:{
         fontSize: 14,
         fontWeight: 'bold',
         paddingBottom: 5,
    },
    inactiveText:{
        fontSize: 14,
        paddingBottom: 5,
        fontWeight:'normal',
        color: '#666'
    },
    activeOption:{
        borderBottomWidth: 4,
        borderColor:"#E9435E",
    },
    options:{
        flexDirection: 'row',
        gap: 20,
        alignItems: 'center',
    },
    optionsContainer:{
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 60
    },
    searchBar:{
        padding:10,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 15,
        width: '60%',
        backgroundColor: '#fff',
    }
});
export default Interview;