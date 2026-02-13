/**
 * User and Family Member Type Definitions
 *
 * This file defines the core data models for users and family members in The Vine app.
 * A "User" is someone with an authenticated account (logged into the app).
 * A "FamilyMember" is anyone in the family tree -- they may or may not have an app account.
 * Relationships between family members are stored as an array on each FamilyMember,
 * pointing to other members by ID. Sibling relationships are NOT stored directly;
 * instead, they are derived at runtime by checking for shared parents.
 */

/**
 * User - Represents an authenticated app user.
 * Created when someone signs up for an account via Firebase Auth.
 * A User may be linked to a FamilyMember via FamilyMember.userId.
 */
export interface User {
  id: string; // Unique identifier, typically the Firebase Auth UID
  email: string; // The user's email address used for login
  displayName: string; // The name shown in the UI (e.g., "Eli Herman")
  photoURL?: string; // Optional URL to the user's profile photo
  createdAt: Date; // Timestamp when the user account was created
  updatedAt: Date; // Timestamp when the user account was last modified
}

/**
 * FamilyMember - Represents any person in the family tree.
 * This includes living and deceased members, and people who may not have an app account.
 * Each member stores their own list of relationships pointing to other members by ID.
 */
export interface FamilyMember {
  id: string; // Unique identifier for this family member
  userId?: string; // If this person has an app account, this links to their User.id
  firstName: string; // The member's first name (e.g., "Eli")
  lastName: string; // The member's last name (e.g., "Herman")
  nickname?: string; // Optional informal name (e.g., "Grandma", "Dad")
  photoURL?: string; // Optional URL to a profile photo
  birthDate?: Date; // Optional date of birth
  deathDate?: Date; // Optional date of death (set for deceased members)
  bio?: string; // Optional short biography or description
  gender?: 'male' | 'female'; // Used for gendered relationship labels (e.g., "Brother-in-law" vs "Sister-in-law")
  relationships: Relationship[]; // Array of connections to other family members (parent, child, spouse, etc.)
  createdBy: string; // ID of the user who added this member to the tree
  createdAt: Date; // Timestamp when this member was first added
  updatedAt: Date; // Timestamp when this member's info was last changed
}

/**
 * NewMemberInput - The data required to add a new family member.
 * This is a subset of FamilyMember fields; the system auto-generates
 * id, relationships, createdBy, createdAt, and updatedAt.
 */
export interface NewMemberInput {
  firstName: string; // Required: the new member's first name
  lastName: string; // Required: the new member's last name
  nickname?: string; // Optional informal name
  photoURL?: string; // Optional profile photo URL
  birthDate?: Date; // Optional date of birth
  deathDate?: Date; // Optional date of death
  bio?: string; // Optional short biography
  gender?: 'male' | 'female'; // Optional gender for gendered labels
  relationshipType?: ParentRelationshipType; // Optional: how this member is related (biological, adopted, step, guardian)
}

/**
 * Relationship - A single directional link from one family member to another.
 * For example, if Eli's relationships include { memberId: 'shelby', type: 'parent' },
 * that means Shelby is Eli's parent. The reverse relationship (Shelby -> Eli as 'child')
 * is stored separately on Shelby's FamilyMember record.
 */
export interface Relationship {
  memberId: string; // The ID of the other family member this relationship points to
  type: RelationshipType; // What kind of relationship this is (parent, child, spouse, etc.)
  kind?: ParentRelationshipType; // Optional qualifier for parent/child relationships (biological, adopted, step, guardian)
}

/**
 * ParentRelationshipType - Describes the nature of a parent-child bond.
 * Used to distinguish biological parents from step-parents, adoptive parents, etc.
 * This affects the displayed label (e.g., "Your Stepdad" vs "Your Dad").
 */
export type ParentRelationshipType = 'biological' | 'adopted' | 'step' | 'guardian';

/**
 * ExtendedRelativeType - Categories for extended family members.
 * Used when displaying or filtering relatives beyond the immediate family.
 */
export type ExtendedRelativeType = 'grandparent' | 'aunt-uncle' | 'cousin';

/**
 * RelationshipType - All possible relationship types between two family members.
 * 'parent' = the other member is this person's parent
 * 'child' = the other member is this person's child
 * 'spouse' = the other member is this person's spouse/partner
 * 'sibling' = the other member is this person's sibling (typically derived, not stored)
 * 'grandparent' = the other member is this person's grandparent (typically derived, not stored)
 * 'grandchild' = the other member is this person's grandchild (typically derived, not stored)
 */
export type RelationshipType =
  | 'parent'
  | 'child'
  | 'spouse'
  | 'sibling'
  | 'grandparent'
  | 'grandchild';
