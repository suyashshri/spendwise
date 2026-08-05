import { Tabs } from 'expo-router';

import { TabBar } from '@/components/TabBar';
import { useCategories } from '@/hooks/useCategories';

export default function TabsLayout() {
  // Fetched once here (defaults + this user's custom categories) so it's already warm by the
  // time any screen's CategoryAvatar/CategoryPicker/CategoryDropdown needs it — those subscribe
  // directly to the store rather than each triggering their own fetch.
  useCategories();

  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="transactions" options={{ title: 'Transactions' }} />
      <Tabs.Screen name="budgets" options={{ title: 'Budgets' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
