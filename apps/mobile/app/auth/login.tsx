import { useState } from 'react';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { FadeInView } from '@/components/FadeInView';
import { TextField } from '@/components/TextField';
import { ThemedText } from '@/components/themed-text';
import { Gradients } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
  const theme = useTheme();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    const result = await login(email.trim().toLowerCase(), password);
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <FadeInView style={styles.brandWrap}>
            <LinearGradient colors={Gradients[scheme].hero} style={styles.logo}>
              <ThemedText style={styles.logoText}>₹</ThemedText>
            </LinearGradient>
            <ThemedText type="title" style={styles.brand}>
              SpendWise
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              Log in to keep tracking your spending
            </ThemedText>
          </FadeInView>

          <FadeInView delay={100} style={styles.form}>
            <TextField
              label="Email"
              icon="mail-outline"
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextField
              label="Password"
              icon="lock-closed-outline"
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {error ? (
              <ThemedText themeColor="danger" style={styles.error}>
                {error}
              </ThemedText>
            ) : null}

            <View style={styles.buttonWrap}>
              <Button
                title="Log in"
                onPress={onSubmit}
                loading={isSubmitting}
                disabled={!email || !password}
              />
            </View>
          </FadeInView>

          <Link href="/auth/register" style={styles.link}>
            <ThemedText themeColor="primary" style={styles.linkText}>
              Don&apos;t have an account? Sign up
            </ThemedText>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  brandWrap: { alignItems: 'center', marginBottom: 36, gap: 6 },
  logo: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  logoText: { fontSize: 30, fontWeight: '800', color: '#fff' },
  brand: { fontSize: 28, lineHeight: 34 },
  subtitle: { fontSize: 14 },
  form: { gap: 16 },
  error: { fontSize: 14 },
  buttonWrap: { marginTop: 8 },
  link: { alignSelf: 'center', marginTop: 28 },
  linkText: { fontSize: 14, fontWeight: '600' },
});
