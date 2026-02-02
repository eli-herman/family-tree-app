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
  relationships: Relationship[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Relationship {
  memberId: string;
  type: RelationshipType;
}

export type RelationshipType =
  | 'parent'
  | 'child'
  | 'spouse'
  | 'sibling'
  | 'grandparent'
  | 'grandchild';
