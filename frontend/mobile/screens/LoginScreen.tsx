import { StyleSheet, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, View } from 'react-native';
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { palette, buttons } from '../constants/theme';

interface LoginScreenProps {
  onLogin: () => void;
  onBack?: () => void;
  onSwitchToRegister?: () => void;
}

// Validate ucla.edu email
const isValidUclaEmail = (email: string): boolean => {
  return (
    email.toLowerCase().endsWith('@ucla.edu') ||
    email.toLowerCase().endsWith('@g.ucla.edu')
  );
};

export default function LoginScreen({ onLogin, onBack, onSwitchToRegister }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleLogin = async () => {
    // Validate email format
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Validate ucla.edu email
    if (!isValidUclaEmail(email)) {
      Alert.alert('Error', 'Please use a @ucla.edu email address');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        Alert.alert('Login Error', error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        onLogin();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Missing Email', 'Enter your UCLA email to reset your password.');
      return;
    }

    if (!isValidUclaEmail(email)) {
      Alert.alert('Invalid Email', 'Please use a @ucla.edu email address.');
      return;
    }

    setResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());

      if (error) {
        Alert.alert('Reset Error', error.message);
        return;
      }

      Alert.alert('Password Reset', 'Check your UCLA inbox for a reset link.');
    } catch (error: any) {
      Alert.alert('Reset Error', error.message || 'Unable to send reset email.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <View style={styles.iconStack}>
          <View style={[styles.iconCircle, styles.iconCirclePrimary]} />
          <View style={[styles.iconCircle, styles.iconCircleSecondary]} />
        </View>

        <Text style={styles.title}>{'Log in using your\nUCLA account'}</Text>
        
        <View style={styles.formGroup}>
          <TextInput
            style={styles.input}
            placeholder="UCLA email"
            placeholderTextColor={palette.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={palette.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={handleForgotPassword}
              disabled={resetting}
            >
              <Text style={[styles.forgotPasswordText, resetting && styles.forgotPasswordTextDisabled]}>
                {resetting ? 'Sending reset link…' : 'Forgot your password?'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Logging in...' : 'Log in'}
          </Text>
        </TouchableOpacity>

        {onSwitchToRegister && (
          <TouchableOpacity style={styles.switchButton} onPress={onSwitchToRegister}>
            <Text style={styles.switchText}>
              Don't have an account? <Text style={styles.switchTextBold}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.surface,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingBottom: 48,
    justifyContent: 'center',
    backgroundColor: palette.surface,
  },
  iconStack: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 40,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  iconCirclePrimary: {
    backgroundColor: '#202F46',
  },
  iconCircleSecondary: {
    backgroundColor: buttons.primaryBackground,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
    color: palette.navy,
  },
  formGroup: {
    width: '100%',
    marginBottom: 24,
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.surfaceSubtle,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: palette.surfaceSubtle,
    fontSize: 16,
    color: palette.navy,
  },
  forgotPasswordButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    fontSize: 13,
    color: palette.textMuted,
  },
  forgotPasswordTextDisabled: {
    color: palette.textSecondary,
  },
  button: {
    backgroundColor: buttons.primaryBackground,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: buttons.primaryText,
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    color: palette.textMuted,
  },
  switchTextBold: {
    fontWeight: '600',
    color: buttons.primaryBackground,
  },
});
