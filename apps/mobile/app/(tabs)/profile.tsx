import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, logout } = useAuth();

  const onLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <View style={styles.content}>
        <ThemedText type="subtitle" style={styles.title}>
          Profile
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.name}>{user?.name}</ThemedText>
          <ThemedText themeColor="textSecondary">{user?.email}</ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.card}>
          <Row label="Currency" value={user?.currency ?? 'INR'} />
          <Row label="Sign-in method" value={user?.authProvider === 'google' ? 'Google' : 'Email'} />
        </ThemedView>

        <Pressable style={[styles.logoutButton, { borderColor: theme.danger }]} onPress={onLogout}>
          <ThemedText themeColor="danger" style={styles.logoutText}>
            Log out
          </ThemedText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <ThemedText themeColor="textSecondary">{label}</ThemedText>
      <ThemedText style={styles.rowValue}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 20, gap: 20 },
  title: { marginBottom: 4 },
  card: { borderRadius: 16, padding: 16, gap: 10 },
  name: { fontSize: 18, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowValue: { fontWeight: '600' },
  logoutButton: { borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 'auto' },
  logoutText: { fontWeight: '600', fontSize: 16 },
});
