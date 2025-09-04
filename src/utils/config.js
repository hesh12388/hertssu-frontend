import * as AuthSession from 'expo-auth-session';
export const authConfig = {
  clientId: process.env.EXPO_PUBLIC_MS_CLIENT_ID,
  redirectUri: AuthSession.makeRedirectUri({
    scheme: 'hertssu',
    path: 'redirect',
  })
};