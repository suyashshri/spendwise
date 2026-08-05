import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import type { Category } from '@spendwise/shared';

import { AnimatedPressable } from './AnimatedPressable';
import { Button } from './Button';
import { ThemedText } from './themed-text';
import { useCategories } from '@/hooks/useCategories';
import { useTheme } from '@/hooks/use-theme';
import { Radii } from '@/constants/theme';
import { extractApiErrorMessage } from '@/services/api';

const ICON_CHOICES = ['💼', '🎁', '🐾', '✈️', '🏋️', '📱', '🎨', '🧾', '💰', '🍺', '🎮', '🚕', '⚽', '🛠️', '🧸', '🌱'];
const COLOR_CHOICES = [
  '#6C5CE7',
  '#00B894',
  '#E17055',
  '#0984E3',
  '#FDCB6E',
  '#D63031',
  '#00CEC9',
  '#E84393',
];

export function CreateCategoryModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: (category: Category) => void;
}) {
  const theme = useTheme();
  const { addCategory } = useCategories();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(ICON_CHOICES[0]);
  const [color, setColor] = useState(COLOR_CHOICES[0]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const reset = () => {
    setName('');
    setIcon(ICON_CHOICES[0]);
    setColor(COLOR_CHOICES[0]);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async () => {
    if (!name.trim()) {
      setError('Enter a name');
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const category = await addCategory({ name: name.trim(), icon, color });
      onCreated(category);
      handleClose();
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={[styles.sheet, { backgroundColor: theme.surfaceElevated }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>New category</ThemedText>
            <AnimatedPressable onPress={handleClose} scaleTo={0.9} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </AnimatedPressable>
          </View>

          <View style={styles.previewRow}>
            <View style={[styles.previewAvatar, { backgroundColor: `${color}26` }]}>
              <ThemedText style={styles.previewIcon}>{icon}</ThemedText>
            </View>
            <TextInput
              style={[styles.nameInput, { borderColor: theme.border, color: theme.text }]}
              placeholder="e.g. Side Hustle"
              placeholderTextColor={theme.textTertiary}
              value={name}
              onChangeText={setName}
              autoFocus
            />
          </View>

          <ThemedText themeColor="textSecondary" style={styles.fieldLabel}>
            Icon
          </ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRow}>
            {ICON_CHOICES.map((choice) => (
              <AnimatedPressable
                key={choice}
                onPress={() => setIcon(choice)}
                scaleTo={0.9}
                style={[
                  styles.iconChoice,
                  { borderColor: choice === icon ? theme.primary : theme.border, backgroundColor: theme.background },
                ]}
              >
                <ThemedText style={styles.previewIcon}>{choice}</ThemedText>
              </AnimatedPressable>
            ))}
          </ScrollView>

          <ThemedText themeColor="textSecondary" style={styles.fieldLabel}>
            Color
          </ThemedText>
          <View style={styles.choiceRow}>
            {COLOR_CHOICES.map((choice) => (
              <AnimatedPressable
                key={choice}
                onPress={() => setColor(choice)}
                scaleTo={0.9}
                style={[
                  styles.colorChoice,
                  { backgroundColor: choice, borderColor: choice === color ? theme.text : 'transparent' },
                ]}
              />
            ))}
          </View>

          {error ? (
            <ThemedText themeColor="danger" style={styles.error}>
              {error}
            </ThemedText>
          ) : null}

          <View style={styles.submitWrap}>
            <Button title="Create category" onPress={onSubmit} loading={isSaving} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: Radii.xl, borderTopRightRadius: Radii.xl, padding: 20, gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '700' },
  closeButton: { padding: 4 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  previewAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  previewIcon: { fontSize: 20 },
  nameInput: { flex: 1, borderWidth: 1.5, borderRadius: Radii.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 },
  choiceRow: { flexDirection: 'row', gap: 10, paddingVertical: 4 },
  iconChoice: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorChoice: { width: 32, height: 32, borderRadius: 16, borderWidth: 2 },
  error: { fontSize: 13 },
  submitWrap: { marginTop: 8 },
});
