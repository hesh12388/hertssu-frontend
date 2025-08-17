import { useAuth } from '@/App';
import { Ionicons } from '@expo/vector-icons';
import { createDrawerNavigator } from '@react-navigation/drawer';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePermissions } from '../hooks/usePermissions';
import Home from '../screens/Home';
import Interview from '../screens/Interviews/Interview';
import Proposals from '../screens/Proposals/Proposals';
import Tasks from '../screens/Tasks/Tasks';
const Drawer = createDrawerNavigator();

const CustomDrawerContent = ({ navigation, state }: { navigation: any, state:any }) => {

  const auth = useAuth();
  const {
    canSeeWarnings,
    canSeeTeam,
    canSeeInterviews,
    canSeeProposals,
  } = usePermissions(auth?.user || null);
  const currentRoute = state?.routeNames[state.index] || 'Home';

  type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

  type MenuItem = {
    name: string;
    icon: IoniconName;
    route: string;
  };

  const menuItems: MenuItem[] = [
    { name: 'Home', icon: 'home-outline', route: 'Home' },
    { name: 'Tasks', icon: 'grid-outline', route: 'Tasks' },
    { name: 'Meetings', icon: 'calendar-outline', route: 'Meetings' },
    { name: 'My Progress', icon: 'bar-chart-outline', route: 'MyProgress' },
    canSeeWarnings && { name: 'Warnings', icon: 'warning-outline', route: 'Warnings' },
    canSeeTeam && { name: 'Team', icon: 'accessibility-outline', route: 'Team' },
    canSeeInterviews && { name: 'Interviews', icon: 'person-outline', route: 'Interviews' },
    canSeeProposals && { name: 'Proposals', icon: 'newspaper-outline', route: 'Proposals' },
  ].filter(Boolean) as MenuItem[];

  return (
    <SafeAreaView style={styles.drawerContainer}>
      {/* Header Section */}
      <View style={styles.header}>
         <Image
            source={require('../../assets/images/su_logo.png')}
            style={styles.logo}
          />
        <View>
            <Text style={styles.nameText}>{auth?.user?.name}</Text>
            <Text style ={styles.emailText}>{auth?.user?.email}</Text>
        </View>
      </View>

      {/* Navigation Items */}
      <View style={styles.navItems}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={[
              styles.navItem,
              currentRoute === item.route && styles.activeNavItem,
            ]}
            onPress={() => navigation.navigate(item.route)}
          >
            <Ionicons
              name={item.icon}
              size={24}
              color={currentRoute === item.route ? '#fff' : '#000'}
            />
            <Text
              style={[
                styles.navItemText,
                currentRoute === item.route && styles.activeNavItemText,
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => auth?.logout()} 
        >
          <Ionicons name="log-out-outline" size={24} color="#E9435E" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
    </SafeAreaView>
  );
};

const AppNavigator = () => {
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: 350,
          backgroundColor: '#fff',
          borderTopRightRadius: 50,
          borderBottomRightRadius: 50,
          overflow: 'hidden',
        },
        drawerType:"front"
      }}
    >
      <Drawer.Screen name="Home" component={Home} />
      <Drawer.Screen name="Interviews" component={Interview}/>
      <Drawer.Screen name="Tasks" component={Tasks}/>
      <Drawer.Screen name="Proposals" component={Proposals}/>
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical:20,
  },
  logo:{
    height: 45,
    width: 45,
    resizeMode: 'contain',
  },
  header: {
    flexDirection:"row",
    gap:15,
    alignItems:'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 20,
    marginBottom:40
  },
  nameText:{
    fontSize: 30,
    fontWeight: 'bold',
    color: '#111',
  },
  emailText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'gray',
  },
  navItems: {
    flex: 4,
    gap:15
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height:60,
    paddingHorizontal:10,
    borderRadius: 12,
  },
  navItemText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#000',
  },
  activeNavItem: {
    backgroundColor: '#E9435E',
  },
  activeNavItemText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  proButton: {
    backgroundColor: '#E9435E',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  proButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal:10
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#E9435E',
    fontWeight: 'bold',
  },
});

export default AppNavigator;