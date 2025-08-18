import { NavigationContainer } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosInstance } from "axios";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";
import React, { createContext, useContext, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import AppNavigator from "./src/navigation/AppNavigator";
import AuthNavigator from "./src/navigation/AuthNavigator";
import { User } from "./src/types/User";
import { createApi } from "./src/utils/api";
interface AuthContextType {
  userToken: string | null;
  user: User | null;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  api: AxiosInstance;
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global defaults for all queries
      staleTime: 5 * 60 * 1000,       
      gcTime: 10 * 60 * 1000,         
      refetchOnWindowFocus: true,      
      retry: 2,                        
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

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
      console.log(d);
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
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authContextValue}>
        <NavigationContainer>
          {userToken ? <AppNavigator /> : <AuthNavigator />}
        </NavigationContainer>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};

export default App;
