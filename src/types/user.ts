export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FamilyMember {
  id: string;
  userId?: string; // Links to User if they have an account
  firstName: string;
  lastName: string;
  nickname?: string;
  photoURL?: string;
  birthDate?: Date;
  deathDate?: Date;
  bio?: string;
  gender?: 'male' | 'female'; // Needed for relationship labels (e.g., "Brother-in-law" vs "Sister-in-law")
  relationships: Relationship[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewMemberInput {
  firstName: string;
  lastName: string;
  nickname?: string;
  photoURL?: string;
  birthDate?: Date;
  deathDate?: Date;
  bio?: string;
  gender?: 'male' | 'female';
  relationshipType?: ParentRelationshipType;
}

export interface Relationship {
  memberId: string;
  type: RelationshipType;
  kind?: ParentRelationshipType;
}

export type ParentRelationshipType = 'biological' | 'adopted' | 'step' | 'guardian';

export type ExtendedRelativeType = 'grandparent' | 'aunt-uncle' | 'cousin';

export type RelationshipType =
  | 'parent'
  | 'child'
  | 'spouse'
  | 'sibling'
  | 'grandparent'
  | 'grandchild';
