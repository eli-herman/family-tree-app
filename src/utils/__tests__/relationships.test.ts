import { calculateRelationship, getSiblings } from '../relationships';
import type { FamilyMember } from '../../types/user';

const baseDate = new Date('2020-01-01T00:00:00Z');

const createMember = (
  id: string,
  firstName: string,
  gender: FamilyMember['gender'],
  relationships: FamilyMember['relationships'] = [],
): FamilyMember => ({
  id,
  firstName,
  lastName: 'Test',
  gender,
  relationships,
  createdBy: 'seed',
  createdAt: baseDate,
  updatedAt: baseDate,
});

describe('calculateRelationship', () => {
  it('returns a direct parent label with biological context', () => {
    const me = createMember('me', 'Me', 'male', [
      { memberId: 'mom', type: 'parent', kind: 'biological' },
    ]);
    const mom = createMember('mom', 'Mom', 'female');

    expect(calculateRelationship('me', 'mom', [me, mom])).toBe('Your Mom');
  });

  it('detects in-law relationships through siblings', () => {
    const me = createMember('me', 'Me', 'female', [{ memberId: 'p1', type: 'parent' }]);
    const sibling = createMember('sib', 'Sam', 'male', [
      { memberId: 'p1', type: 'parent' },
      { memberId: 'spouse', type: 'spouse' },
    ]);
    const spouse = createMember('spouse', 'Casey', 'male', [{ memberId: 'sib', type: 'spouse' }]);
    const parent = createMember('p1', 'Pat', 'female');

    expect(calculateRelationship('me', 'spouse', [me, sibling, spouse, parent])).toBe(
      'Your Brother-in-law',
    );
  });
});

describe('getSiblings', () => {
  it('returns members who share a parent', () => {
    const me = createMember('me', 'Me', 'female', [{ memberId: 'p1', type: 'parent' }]);
    const sibling = createMember('sib', 'Sam', 'male', [{ memberId: 'p1', type: 'parent' }]);
    const cousin = createMember('c1', 'Cory', 'male', [{ memberId: 'p2', type: 'parent' }]);

    const siblings = getSiblings('me', [me, sibling, cousin]);

    expect(siblings).toHaveLength(1);
    expect(siblings[0].id).toBe('sib');
  });
});
