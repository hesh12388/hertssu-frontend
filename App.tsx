import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';


interface AuthContextType {
  userToken: string | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Create a auth context to be used in any other screen
const AuthContext = createContext<AuthContextType | null>(null);
export const useAuth = () => useContext(AuthContext);

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null); 

  // Check if user is logged in on load by retrieving stored token
  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        setUserToken(token);
      } catch (e) {
        console.error('Failed to load token');
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, []);

  // Show loading spinner during token check
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // context value includes token, and login/logout functions
  const authContextValue: AuthContextType= {
    userToken,
    login: async (token: string) => {
      await AsyncStorage.setItem('userToken', token);
      setUserToken(token);
    },
    logout: async () => {
      await AsyncStorage.removeItem('userToken');
      setUserToken(null);
    },
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      <NavigationContainer>
        {userToken ? <AppNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </AuthContext.Provider>
  );
};

export default App;
