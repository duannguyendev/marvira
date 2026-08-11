export type AlertButtonStyle = 'default' | 'cancel' | 'destructive';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: AlertButtonStyle;
}

export interface AlertConfig {
  title?: string;
  message?: string;
  buttons?: AlertButton[];
  /** Default false — tap overlay/back will not dismiss unless explicitly enabled. */
  dismissOnOverlayPress?: boolean;
}

export interface AlertOptions {
  dismissOnOverlayPress?: boolean;
}

type ShowAlertFn = (config: AlertConfig) => void;

let showAlertImpl: ShowAlertFn | null = null;

export function registerShowAlert(fn: ShowAlertFn | null) {
  showAlertImpl = fn;
}

export const appAlert = {
  alert(
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: AlertOptions,
  ) {
    showAlertImpl?.({
      title,
      message,
      buttons,
      dismissOnOverlayPress: options?.dismissOnOverlayPress ?? false,
    });
  },
};
