import React from 'react';
import { StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';

export interface ScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: Edge[];
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  style,
  edges = ['top', 'left', 'right'],
}) => (
  <SafeAreaView style={[styles.screen, style]} edges={edges}>
    {children}
  </SafeAreaView>
);

export function withScreenSafeArea<P extends object>(
  Component: React.ComponentType<P>,
  edges?: Edge[],
) {
  const Wrapped = (props: P) => (
    <Screen edges={edges}>
      <Component {...props} />
    </Screen>
  );
  Wrapped.displayName = `withScreenSafeArea(${
    Component.displayName || Component.name || 'Component'
  })`;
  return Wrapped;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
