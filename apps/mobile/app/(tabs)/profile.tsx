import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ScrollView, StyleSheet, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CurrencyPicker } from '@/components/CurrencyPicker';
import { FadeInView } from '@/components/FadeInView';
import { ThemedText } from '@/components/themed-text';
import { FloatingTabBarSpace, Gradients } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { confirmAction } from '@/utils/confirm';

export default function ProfileScreen() {
  const theme = useTheme();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const { user, logout, updateProfile } = useAuth();
  const [isEditingCurrency, setIsEditingCurrency] = useState(false);
  const [isSavingCurrency, setIsSavingCurrency] = useState(false);

  const onLogout = () => {
    confirmAction({
      title: 'Log out',
      message: 'Are you sure you want to log out?',
      confirmLabel: 'Log out',
      destructive: true,
      onConfirm: logout,
    });
  };

  const onChangeCurrency = async (currency: string) => {
    setIsSavingCurrency(true);
    await updateProfile({ currency });
    setIsSavingCurrency(false);
    setIsEditingCurrency(false);
  };

  const initial = user?.name?.trim()?.[0]?.toUpperCase() ?? '?';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">Profile</ThemedText>

        <FadeInView>
          <Card style={styles.profileCard}>
            <LinearGradient colors={Gradients[scheme].hero} style={styles.avatar}>
              <ThemedText style={styles.avatarText}>{initial}</ThemedText>
            </LinearGradient>
            <View style={styles.identity}>
              <ThemedText style={styles.name}>{user?.name}</ThemedText>
              <ThemedText themeColor="textSecondary">{user?.email}</ThemedText>
            </View>
          </Card>
        </FadeInView>

        <FadeInView delay={80}>
          <Card style={{ gap: 4 }}>
            <AnimatedPressable onPress={() => setIsEditingCurrency((v) => !v)} scaleTo={0.98}>
              <Row icon="cash" label="Currency" value={user?.currency ?? 'INR'} theme={theme} />
            </AnimatedPressable>
            {isEditingCurrency ? (
              <View style={styles.currencyEditor}>
                {isSavingCurrency ? (
                  <ThemedText themeColor="textSecondary">Saving…</ThemedText>
                ) : (
                  <CurrencyPicker value={user?.currency ?? 'INR'} onChange={onChangeCurrency} />
                )}
              </View>
            ) : null}
            <Row
              icon={user?.authProvider === 'google' ? 'logo-google' : 'mail'}
              label="Sign-in method"
              value={user?.authProvider === 'google' ? 'Google' : 'Email'}
              theme={theme}
              last
            />
          </Card>
        </FadeInView>

        <FadeInView delay={140} style={styles.logoutWrap}>
          <Button
            title="Log out"
            variant="danger"
            onPress={onLogout}
            icon={<Ionicons name="log-out-outline" size={18} color="#fff" />}
          />
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  icon,
  label,
  value,
  theme,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  theme: ReturnType<typeof useTheme>;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: theme.border }]}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={18} color={theme.textSecondary} />
        <ThemedText themeColor="textSecondary">{label}</ThemedText>
      </View>
      <ThemedText style={styles.rowValue}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 20, paddingBottom: FloatingTabBarSpace },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#fff' },
  identity: { gap: 2 },
  name: { fontSize: 17, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  currencyEditor: { paddingBottom: 12 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowValue: { fontWeight: '700' },
  logoutWrap: { marginTop: 8 },
});
