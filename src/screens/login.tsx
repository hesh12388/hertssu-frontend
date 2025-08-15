import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { useAuth } from '@/App';
import { loginWithMicrosoft } from '../utils/msAuth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();

  const handleLogin = async () => {
    if(!email || !password) {
      alert('Please enter both email and password');
      return;
    }

    setIsLoading(true);

    try{
      const response = await fetch(`${process.env.EXPO_PUBLIC_API}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        await auth?.login(data.token, data.refreshToken);
      }
      else{
        Alert.alert('Login Failed', data.message || 'An error occurred');
      }
    }
    catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', 'An unexpected error occurred');
    }
    finally {
      setIsLoading(false);
    }
  }

  const handleOAuth = async () => {
    setIsLoading(true);
    try {
      // Get Microsoft tokens
      const microsoftTokens = await loginWithMicrosoft();
      
      if (!microsoftTokens) {
        Alert.alert('Login Failed', 'Microsoft authentication was cancelled or failed');
        return;
      }

      // Send Microsoft tokens to your backend
      const response = await fetch(`${process.env.EXPO_PUBLIC_API}/auth/oauth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_token: microsoftTokens.idToken,
          access_token: microsoftTokens.accessToken,
          refresh_token: microsoftTokens.refreshToken,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Same as email/password flow - login with your JWT tokens
        await auth?.login(data.token, data.refreshToken);
      } else {
        Alert.alert('Login Failed', data.message || 'An error occurred');
      }
    } catch (error) {
      console.error('OAuth login error:', error);
      Alert.alert('Login Failed', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
        keyboardVerticalOffset={50}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
        
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/hertsu_logo.png')}
              style={styles.logo}
            />
          </View>

        
          <View style={styles.inputSection}>
            <Text style={styles.title}>Sign in to your Account</Text>
            <Text style={styles.authText}>Enter your email and password to log in</Text>

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!isLoading}
              placeholderTextColor="#999"
            />
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
              placeholderTextColor="#999"
            />

            <Text style={styles.forgotPassword}>Forgot password?</Text>

            <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleLogin} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.loginButtonText}>Log In</Text>
              )}
            </TouchableOpacity>
          </View>

       
          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.line} />
          </View>

        
          <TouchableOpacity style={styles.authButton} onPress={handleOAuth} disabled={isLoading}>
            <Image source={require('../../assets/images/outlook_icon.png')} style={styles.authLogo} />
                <Text style={styles.buttonText}>Continue with Outlook</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;


const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
  },
  scroll: {
    padding:40,
  },
  logoContainer: {
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  logo: {
    height: 50,
    width: 130,
    resizeMode: 'contain',
  },
  inputSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 10,
  },
  authText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 14,
    color: '#444',
    marginBottom: 6,
    marginTop: 12,
    fontWeight: '500',
    },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  forgotPassword: {
    color: '#E9435E',
    fontSize: 14,
    fontWeight: '500',
    alignSelf: 'flex-start',
    marginBottom: 25,
  },
  button: {
    width: '100%',
    backgroundColor: '#E9435E',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  authButton: {
    width: '100%',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap:10,
    height: 60,
    marginTop: 20,
    borderColor: '#e0e0e0',
    borderWidth: 1,
  },
  authLogo:{
    height: "60%",
    width: "10%",
    resizeMode: 'contain',
  },
  loginButtonText:{
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  orText: {
    marginHorizontal: 10,
    color: '#888',
    fontSize: 14,
  },
});
