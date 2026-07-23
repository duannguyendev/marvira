import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { Input } from './Input';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';

interface JoinEventPasswordSheetProps {
  visible: boolean;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (password: string) => void;
}

export const JoinEventPasswordSheet: React.FC<JoinEventPasswordSheetProps> = ({
  visible,
  loading,
  error,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!visible) {
      setPassword('');
    }
  }, [visible]);

  const handleSubmit = () => {
    if (password.trim().length >= 4) {
      onSubmit(password.trim());
    }
  };

  const handleClose = () => {
    setPassword('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>{t('events.join.title')}</Text>
          <Text style={styles.message}>{t('events.join.message')}</Text>
          <Input
            label={t('events.join.passwordLabel')}
            value={password}
            onChangeText={setPassword}
            placeholder={t('events.join.passwordPlaceholder')}
            secureTextEntry
            autoCapitalize="none"
            error={error}
            onSubmitEditing={handleSubmit}
          />
          <Button
            title={t('events.join.submit')}
            onPress={handleSubmit}
            loading={loading}
            disabled={password.trim().length < 4}
            fullWidth
            style={styles.submitButton}
          />
          <Text style={styles.hint}>{t('events.join.hint')}</Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: borderRadius.sm,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textDark,
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  submitButton: {
    marginTop: spacing.sm,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 20,
  },
});
