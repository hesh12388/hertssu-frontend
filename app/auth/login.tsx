import React from 'react';
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';

const Login = () => {
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
            />
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
            />

            <Text style={styles.forgotPassword}>Forgot password?</Text>

            <Pressable style={styles.button}>
              <Text style={styles.loginButtonText}>Log In</Text>
            </Pressable>
          </View>

       
          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.line} />
          </View>

        
          <Pressable style={styles.authButton}>
            <Image source={require('../../assets/images/outlook_icon.png')} style={styles.authLogo} />
            <Text style={styles.buttonText}>Continue with Outlook</Text>
          </Pressable>
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
