import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
} from '../theme';

function defaultScheduleDate(): Date {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d;
}

interface ScheduleDateTimeFieldProps {
  value: Date;
  onChange: (next: Date) => void;
  error?: string;
  minimumDate?: Date;
}

/**
 * Local-timezone date+time picker. iOS uses combined datetime;
 * Android opens date then time sequentially.
 */
export const ScheduleDateTimeField: React.FC<ScheduleDateTimeFieldProps> = ({
  value,
  onChange,
  error,
  minimumDate,
}) => {
  const { t } = useTranslation();
  const [androidStep, setAndroidStep] = useState<'hidden' | 'date' | 'time'>(
    'hidden',
  );
  const [iosOpen, setIosOpen] = useState(false);

  const min = minimumDate ?? new Date();

  const onAndroidChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === 'dismissed') {
      setAndroidStep('hidden');
      return;
    }
    if (!selected) {
      setAndroidStep('hidden');
      return;
    }

    if (androidStep === 'date') {
      const next = new Date(value);
      next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      onChange(next);
      setAndroidStep('time');
      return;
    }

    if (androidStep === 'time') {
      const next = new Date(value);
      next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      onChange(next);
      setAndroidStep('hidden');
    }
  };

  const onIosChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (selected) {
      onChange(selected);
    }
  };

  return (
    <View>
      <Text style={styles.label}>{t('createEvent.schedule.localLabel')}</Text>
      <TouchableOpacity
        style={[styles.field, error ? styles.fieldError : null]}
        onPress={() => {
          if (Platform.OS === 'android') {
            setAndroidStep('date');
          } else {
            setIosOpen(open => !open);
          }
        }}
        accessibilityRole="button"
        accessibilityLabel={t('createEvent.schedule.localLabel')}>
        <Text style={styles.fieldText}>{value.toLocaleString()}</Text>
        <Text style={styles.fieldHint}>{t('createEvent.schedule.tapToChange')}</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {Platform.OS === 'android' && androidStep !== 'hidden' ? (
        <DateTimePicker
          value={value}
          mode={androidStep}
          display="default"
          minimumDate={min}
          onChange={onAndroidChange}
        />
      ) : null}

      {Platform.OS === 'ios' && iosOpen ? (
        <View style={styles.iosPicker}>
          <DateTimePicker
            value={value}
            mode="datetime"
            display="spinner"
            minimumDate={min}
            onChange={onIosChange}
            style={styles.iosControl}
          />
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => setIosOpen(false)}>
            <Text style={styles.doneText}>{t('common.ok')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

export { defaultScheduleDate };

const styles = StyleSheet.create({
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textDark,
    marginBottom: spacing.sm,
  },
  field: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  fieldError: {
    borderColor: colors.error,
  },
  fieldText: {
    fontSize: fontSize.md,
    color: colors.textDark,
    fontWeight: fontWeight.semibold,
  },
  fieldHint: {
    marginTop: spacing.xs,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  errorText: {
    marginTop: spacing.xs,
    fontSize: fontSize.xs,
    color: colors.error,
  },
  iosPicker: {
    marginTop: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  iosControl: {
    height: 180,
  },
  doneButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  doneText: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.md,
  },
});
