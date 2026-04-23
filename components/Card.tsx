import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { Colors, Shadows, BorderRadius, Spacing } from '../constants/theme';
import { BlurView } from 'expo-blur';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  glass?: boolean;
}

export const Card = ({ children, style, glass = false }: CardProps) => {
  if (glass && Platform.OS !== 'android') {
    return (
      <BlurView intensity={80} tint="light" style={[styles.card, styles.glass, style]}>
        {children}
      </BlurView>
    );
  }

  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.medium,
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
});
