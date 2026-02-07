import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../../constants';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'green' | 'brown' | 'branch';
  style?: ViewStyle;
}

const sizes = {
  sm: 32,
  md: 44,
  lg: 56,
  xl: 80,
};

const fontSizes = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
};

export function Avatar({ uri, name, size = 'md', variant = 'green', style }: AvatarProps) {
  const dimension = sizes[size];
  const fontSize = fontSizes[size];
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  const gradientColors = {
    green: [colors.primary.light, colors.primary.main],
    brown: [colors.brown.light, colors.brown.main],
    branch: [colors.brown.branch, colors.brown.main],
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          backgroundColor: gradientColors[variant][1],
        },
        style,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.image, { borderRadius: dimension / 2 }]}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <Text style={[styles.initial, { fontSize }]}>{initial}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initial: {
    color: colors.text.inverse,
    fontWeight: '600',
  },
});
