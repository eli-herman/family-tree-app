import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '../../src/components/common';
import { colors, typography, spacing, borderRadius } from '../../src/constants';
import { useAuthStore } from '../../src/stores';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const { resetPassword, isLoading, error, clearError } = useAuthStore();

  const handleReset = async () => {
    if (!email.trim()) return;
    await resetPassword(email.trim());
    if (!useAuthStore.getState().error) {
      setSent(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandingSection}>
            <Text style={styles.appName}>The Vine</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Reset Password</Text>

            {sent ? (
              <View style={styles.successBanner}>
                <Text style={styles.successText}>
                  Check your email! We sent a password reset link to{' '}
                  <Text style={styles.successEmail}>{email}</Text>.
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.description}>
                  Enter the email address associated with your account and we'll
                  send you a link to reset your password.
                </Text>

                {error && (
                  <View style={styles.errorBanner}>
                    <View style={styles.errorAccent} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (error) clearError();
                    }}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.text.tertiary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    spellCheck={false}
                    autoCorrect={false}
                  />
                </View>

                <Button
                  title="Send Reset Link"
                  onPress={handleReset}
                  loading={isLoading}
                  disabled={!email.trim()}
                  size="lg"
                  style={styles.submitButton}
                />
              </>
            )}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.footerLink}>Back to Log In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  brandingSection: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  appName: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.primary.dark,
    letterSpacing: -0.5,
  },
  formCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  formTitle: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  description: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  errorBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(224, 122, 95, 0.1)',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  errorAccent: {
    width: 4,
    backgroundColor: colors.error,
  },
  errorText: {
    ...typography.textStyles.bodySmall,
    color: colors.error,
    padding: spacing.sm,
    paddingLeft: spacing.md,
    flex: 1,
  },
  successBanner: {
    backgroundColor: 'rgba(45, 106, 79, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  successText: {
    ...typography.textStyles.body,
    color: colors.primary.main,
  },
  successEmail: {
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.textStyles.bodySmall,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text.primary,
  },
  submitButton: {
    borderRadius: borderRadius.md,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  footerLink: {
    ...typography.textStyles.body,
    color: colors.primary.main,
    fontWeight: '600',
  },
});
