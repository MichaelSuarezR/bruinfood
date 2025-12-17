import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Constants from 'expo-constants';

interface RegisterScreenProps {
  onRegister: (result: { loggedIn: boolean }) => void;
  onSwitchToLogin: () => void;
}

// Validate ucla.edu email
const isValidUclaEmail = (email: string): boolean => {
  return (
    email.toLowerCase().endsWith('@ucla.edu') ||
    email.toLowerCase().endsWith('@g.ucla.edu')
  );
};

export default function RegisterScreen({ onRegister, onSwitchToLogin }: RegisterScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const apiUrl = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001';

  const handleRegister = async () => {
    // Validate all fields
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Validate ucla.edu email
    if (!isValidUclaEmail(email)) {
      Alert.alert('Error', 'Please use a @ucla.edu email address');
      return;
    }

    // Validate password match
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        Alert.alert('Registration Error', error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Create user in users table
        try {
          const createUserResponse = await fetch(`${apiUrl}/api/users`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: data.user.id,
              email: data.user.email || email.toLowerCase().trim(),
              user_name: data.user.user_metadata?.user_name || null,
            }),
          });

          if (!createUserResponse.ok) {
            const errorData = await createUserResponse.json();
            // If user already exists, that's okay (might have been created elsewhere)
            if (!errorData.error?.includes('already exists') && !errorData.error?.includes('23505')) {
              console.error('Failed to create user profile:', errorData);
            }
          }
        } catch (userError) {
          console.error('Error creating user profile:', userError);
          // Continue anyway - user can still log in
        }

        // Check if email confirmation is required
        // If session exists, user was auto-confirmed (email confirmation disabled)
        if (data.session) {
          // Email confirmation is disabled - user is automatically logged in
          onRegister({ loggedIn: true });
        } else {
          // Email confirmation is required - send user back to login after acknowledging
          Alert.alert(
            'Success', 
            'Account created! Please check your email to verify your account.',
            [{ text: 'OK', onPress: () => onRegister({ loggedIn: false }) }]
          );
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Sign Up</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Email (@ucla.edu)"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creating account...' : 'Sign up'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.switchButton} 
          onPress={onSwitchToLogin}
        >
          <Text style={styles.switchText}>
            Already have an account? <Text style={styles.switchTextBold}>Log in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    color: '#6b7280',
  },
  switchTextBold: {
    fontWeight: '600',
    color: '#3b82f6',
  },
});
