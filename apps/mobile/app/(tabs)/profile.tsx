import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CurrencyPicker } from '@/components/CurrencyPicker';
import { FadeInView } from '@/components/FadeInView';
import { ThemedText } from '@/components/themed-text';
import { FloatingTabBarSpace, Gradients, Radii } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { useThemeStore, type ThemeMode } from '@/store/themeStore';
import { confirmAction } from '@/utils/confirm';

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { mode: 'light', label: 'Light', icon: 'sunny-outline' },
  { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
  { mode: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

export default function ProfileScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const { user, logout, updateProfile } = useAuth();
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
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

        <FadeInView delay={110}>
          <Card style={{ gap: 10 }}>
            <ThemedText themeColor="textSecondary" style={styles.sectionLabel}>
              Appearance
            </ThemedText>
            <View style={[styles.themeRow, { backgroundColor: theme.background }]}>
              {THEME_OPTIONS.map((option) => {
                const selected = option.mode === themeMode;
                return (
                  <AnimatedPressable
                    key={option.mode}
                    onPress={() => setThemeMode(option.mode)}
                    scaleTo={0.95}
                    style={[styles.themeOption, selected && { backgroundColor: theme.primaryMuted }]}
                  >
                    <Ionicons name={option.icon} size={16} color={selected ? theme.primary : theme.textSecondary} />
                    <ThemedText
                      style={styles.themeOptionText}
                      themeColor={selected ? 'primary' : 'textSecondary'}
                    >
                      {option.label}
                    </ThemedText>
                  </AnimatedPressable>
                );
              })}
            </View>
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
  sectionLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  themeRow: { flexDirection: 'row', gap: 4, borderRadius: Radii.md, padding: 4 },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: Radii.sm,
  },
  themeOptionText: { fontSize: 13, fontWeight: '700' },
  logoutWrap: { marginTop: 8 },
});
