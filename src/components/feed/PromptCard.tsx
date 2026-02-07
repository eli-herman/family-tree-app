import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '../../constants';
import { Prompt } from '../../types';

interface PromptCardProps {
  prompt: Prompt;
  onRespond: (prompt: Prompt) => void;
}

export function PromptCard({ prompt, onRespond }: PromptCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🌿</Text>
      <Text style={styles.promptText}>"{prompt.text}"</Text>
      <TouchableOpacity onPress={() => onRespond(prompt)}>
        <Text style={styles.button}>Share a memory →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.brown.branch,
    borderStyle: 'dashed',
    padding: spacing.md,
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  promptText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  button: {
    fontSize: 13,
    color: colors.primary.main,
    fontWeight: '600',
  },
});
