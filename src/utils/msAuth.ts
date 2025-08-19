import * as AuthSession from 'expo-auth-session';
import { authConfig } from './config';

const SCOPES = ['openid', 'profile', 'email'];

export const loginWithMicrosoft = async () => {
  try {
    
    // Create redirect URI
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: authConfig.redirectUri,
      path: 'redirect'
    });

    console.log('Using redirect URI:', redirectUri);

    
    // Create the auth request
    const request = new AuthSession.AuthRequest({
      clientId: authConfig.clientId,
      scopes: SCOPES,
      responseType: AuthSession.ResponseType.Code,
      redirectUri: redirectUri,
      extraParams: {
        prompt: 'select_account', 
      }
    });

    //prepare the code challenge
    await request.makeAuthUrlAsync({
        authorizationEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    })
    // Make the auth request
    const result = await request.promptAsync({
      authorizationEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    });

    if (result.type === 'success') {
      
      const tokens = await AuthSession.exchangeCodeAsync(
        {
          clientId: authConfig.clientId,
          scopes: SCOPES,
          code: result.params.code,
          redirectUri: redirectUri,
          extraParams: { code_verifier: request.codeVerifier! },
        },
        {
          tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        }
      );
      
      return tokens;
    } else {
      console.log('Auth cancelled or failed:', result);
      return null;
    }
  } catch (error) {
    console.error('Microsoft auth error:', error);
    return null;
  }
};