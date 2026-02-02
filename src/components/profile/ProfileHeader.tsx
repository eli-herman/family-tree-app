import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar, Button } from '../common';
import { colors, typography, spacing } from '../../constants';
import { FamilyMember } from '../../types';

interface ProfileHeaderProps {
  member: FamilyMember;
  onEdit?: () => void;
  isCurrentUser?: boolean;
}

export function ProfileHeader({ member, onEdit, isCurrentUser }: ProfileHeaderProps) {
  const fullName = `${member.firstName} ${member.lastName}`;
  const displayName = member.nickname || fullName;

  return (
    <View style={styles.container}>
      <Avatar name={member.firstName} size="xl" variant="green" style={styles.avatar} />
      <Text style={styles.name}>{displayName}</Text>
      {member.nickname && (
        <Text style={styles.fullName}>{fullName}</Text>
      )}
      {member.bio && (
        <Text style={styles.bio}>{member.bio}</Text>
      )}
      {isCurrentUser && onEdit && (
        <Button
          title="Edit Profile"
          onPress={onEdit}
          variant="outline"
          size="sm"
          style={styles.editButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.primary,
  },
  avatar: {
    marginBottom: spacing.md,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  fullName: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  bio: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 280,
  },
  editButton: {
    marginTop: spacing.md,
  },
});
