import { NavigationContainer } from "@react-navigation/native";
import { AxiosInstance } from "axios";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";
import React, { createContext, useContext, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import AppNavigator from "./src/navigation/AppNavigator";
import AuthNavigator from "./src/navigation/AuthNavigator";
import { createApi } from "./src/utils/api";
import { loginWithMicrosoft } from "./src/utils/msAuth";

interface AuthContextType {
  userToken: string | null; // access token (in-memory only)
  user: User | null;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  api: AxiosInstance;
}

export interface User {
  name: string;
  email: string;
  role: string;
  committeeId: number | null;
  subcommitteeId: number | null;
}

// Create a auth context to be used in any other screen
const AuthContext = createContext<AuthContextType | null>(null);
export const useAuth = () => useContext(AuthContext);
const REFRESH_KEY = "refreshToken";

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const decodeToken = (token: string) => {
    try {
      const d: any = jwtDecode(token);
      setUser({
        name: d.name || "",
        email: d.email || "",
        role: d.role || "",
        committeeId: d.committeeId ?? null,
        subcommitteeId: d.subcommitteeId ?? null,
      });
    } catch {
      setUser(null);
    }
  };


  const refreshTokens = async (error: any): Promise<string> => {
    try {
      // Check what type of error it is
      if (error?.response?.data?.error === 'MICROSOFT_REAUTH_REQUIRED')  {
        // Microsoft tokens expired - do Microsoft reauth
        const microsoftTokens = await loginWithMicrosoft();
        
        if (!microsoftTokens) {
          throw new Error('Microsoft login failed');
        }
        
        // Send Microsoft tokens to backend and get new JWT
        const authResponse = await fetch(`${process.env.EXPO_PUBLIC_API}/auth/microsoft`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_token: microsoftTokens.idToken,
            access_token: microsoftTokens.accessToken,
            refresh_token: microsoftTokens.refreshToken,
          }),
        });
        
        const authData = await authResponse.json();
        if (authResponse.ok) {
          setUserToken(authData.accessToken);
          decodeToken(authData.accessToken);
          await SecureStore.setItemAsync(REFRESH_KEY, authData.refreshToken);
          return authData.accessToken;
        }
        
        throw new Error('Microsoft reauth failed');
      }
      else{
          const rt = await SecureStore.getItemAsync(REFRESH_KEY);
          if (!rt) throw new Error("No refresh token");
          const response = await fetch(`${process.env.EXPO_PUBLIC_API}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: rt}),
          });
          
          if (!response.ok) {
            await SecureStore.deleteItemAsync(REFRESH_KEY);
            throw new Error("Refresh failed");
          }

          const data = await response.json();
          setUserToken(data.accessToken);
          decodeToken(data.accessToken);
          await SecureStore.setItemAsync(REFRESH_KEY, data.refreshToken);
          return data.accessToken;
      }
      
    } catch (error) {
      throw error;
    }
  };

  const hardLogout = async () => {
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    setUserToken(null);
    setUser(null);
  };

  const getAccessToken = () => userToken;


  const api = React.useMemo(
      () => createApi(getAccessToken, refreshTokens, hardLogout),
      [getAccessToken, refreshTokens, hardLogout]
    );
  // try silent refresh using refreshToken from SecureStore on app start
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const rt = await SecureStore.getItemAsync(REFRESH_KEY);
        if (!rt) return;

        const res = await fetch(`${process.env.EXPO_PUBLIC_API}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: rt }),
        });

        if (!res.ok) {
          await SecureStore.deleteItemAsync(REFRESH_KEY);
          return;
        }

        const data = await res.json();
        setUserToken(data.accessToken);
        decodeToken(data.accessToken);
        await SecureStore.setItemAsync(REFRESH_KEY, data.refreshToken);
      } catch (e) {

      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
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
  const authContextValue: AuthContextType = {
    userToken,
    user,
    login: async (accessToken: string, refreshToken: string) => {
      setUserToken(accessToken);
      decodeToken(accessToken);
      await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
    },
    logout: hardLogout,
    api
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
