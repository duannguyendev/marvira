import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors, spacing, fontSize, fontWeight} from '../theme';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
  labels,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.track}>
        {Array.from({length: totalSteps}).map((_, index) => {
          const step = index + 1;
          const isActive = step <= currentStep;
          const isLast = step === totalSteps;
          return (
            <React.Fragment key={step}>
              <View
                style={[styles.dot, isActive && styles.dotActive]}>
                <Text style={[styles.dotText, isActive && styles.dotTextActive]}>
                  {step}
                </Text>
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.line,
                    step < currentStep && styles.lineActive,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
      <Text style={styles.label}>
        {labels[currentStep - 1]} ({currentStep}/{totalSteps})
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.backgroundGray,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dotText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  dotTextActive: {
    color: colors.background,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
    maxWidth: 48,
  },
  lineActive: {
    backgroundColor: colors.primary,
  },
  label: {
    textAlign: 'center',
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
});
