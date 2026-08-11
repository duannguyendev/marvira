import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import {
  AlertButton,
  AlertConfig,
  registerShowAlert,
} from '../utils/appAlert';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const ANIMATION_DURATION = 280;

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertConfig | null>(null);
  const pendingCallback = useRef<(() => void) | null>(null);

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  const finishClose = useCallback(() => {
    setVisible(false);
    setConfig(null);
    const callback = pendingCallback.current;
    pendingCallback.current = null;
    callback?.();
  }, []);

  const animateIn = useCallback(() => {
    backdropOpacity.value = withTiming(1, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
    });
    translateY.value = withTiming(0, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
    });
  }, [backdropOpacity, translateY]);

  const animateOut = useCallback(
    (onComplete?: () => void) => {
      backdropOpacity.value = withTiming(0, {
        duration: ANIMATION_DURATION,
        easing: Easing.in(Easing.cubic),
      });
      translateY.value = withTiming(
        SCREEN_HEIGHT,
        {
          duration: ANIMATION_DURATION,
          easing: Easing.in(Easing.cubic),
        },
        finished => {
          if (finished) {
            runOnJS(finishClose)();
            if (onComplete) {
              runOnJS(onComplete)();
            }
          }
        },
      );
    },
    [backdropOpacity, finishClose, translateY],
  );

  const show = useCallback(
    (nextConfig: AlertConfig) => {
      pendingCallback.current = null;
      setConfig(nextConfig);
      setVisible(true);
    },
    [],
  );

  useEffect(() => {
    registerShowAlert(show);
    return () => registerShowAlert(null);
  }, [show]);

  useEffect(() => {
    if (visible) {
      translateY.value = SCREEN_HEIGHT;
      backdropOpacity.value = 0;
      requestAnimationFrame(() => {
        animateIn();
      });
    }
  }, [visible, animateIn, backdropOpacity, translateY]);

  const handleDismiss = useCallback(
    (onComplete?: () => void) => {
      if (!visible) {
        onComplete?.();
        return;
      }
      animateOut(onComplete);
    },
    [animateOut, visible],
  );

  const handleButtonPress = useCallback(
    (button: AlertButton) => {
      handleDismiss(() => {
        button.onPress?.();
      });
    },
    [handleDismiss],
  );

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const dismissOnOverlayPress = config?.dismissOnOverlayPress ?? false;

  const handleOverlayPress = useCallback(() => {
    if (dismissOnOverlayPress) {
      handleDismiss();
    }
  }, [dismissOnOverlayPress, handleDismiss]);

  const buttons: AlertButton[] =
    config?.buttons && config.buttons.length > 0
      ? config.buttons
      : [{ text: t('common.ok'), style: 'default' }];

  const isRowLayout = buttons.length === 2;
  const sortedButtons = isRowLayout
    ? [...buttons].sort((a, b) => {
        if (a.style === 'cancel') {
          return -1;
        }
        if (b.style === 'cancel') {
          return 1;
        }
        return 0;
      })
    : buttons;

  return (
    <>
      {children}
      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={handleOverlayPress}>
        <View style={styles.modalRoot}>
          <Animated.View style={[styles.overlay, backdropStyle]}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={handleOverlayPress}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, spacing.lg) },
              sheetStyle,
            ]}>
            <Pressable onPress={event => event.stopPropagation()}>
              <View style={styles.handle} />
              {config?.title ? (
                <Text style={styles.title}>{config.title}</Text>
              ) : null}
              {config?.message ? (
                <Text style={styles.message}>{config.message}</Text>
              ) : null}
              <View
                style={[
                  styles.actions,
                  isRowLayout ? styles.actionsRow : styles.actionsColumn,
                ]}>
                {sortedButtons.map((button, index) => {
                  const isCancel = button.style === 'cancel';
                  const isDestructive = button.style === 'destructive';

                  return (
                    <Button
                      key={`${button.text}-${index}`}
                      title={button.text}
                      onPress={() => handleButtonPress(button)}
                      variant={
                        isCancel || isDestructive ? 'outline' : 'primary'
                      }
                      style={{
                        ...(isRowLayout ? styles.rowButton : styles.columnButton),
                        ...(isDestructive ? styles.destructiveButton : null),
                      }}
                      textStyle={
                        isDestructive ? styles.destructiveText : undefined
                      }
                    />
                  );
                })}
              </View>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
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
    marginBottom: spacing.lg,
  },
  actions: {
    gap: spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
  },
  actionsColumn: {
    flexDirection: 'column',
  },
  rowButton: {
    flex: 1,
  },
  columnButton: {
    width: '100%',
  },
  destructiveButton: {
    borderColor: colors.error,
  },
  destructiveText: {
    color: colors.error,
  },
});
