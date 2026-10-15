import records from './actions.json';

export type PetType = 'dog' | 'cat' | 'other';
export const ACTION_CATALOG_VERSION = '2026-10-14-v1';
export const petActions = Object.fromEntries(
  (['dog', 'cat', 'other'] as const).map((pet) => [pet, {
    label: { dog: '🐶 Dog', cat: '🐱 Cat', other: '🐾 Other Pet' }[pet],
    actions: records.filter((r) => r.pet === pet).map((r) => r.label),
  }]),
) as Record<PetType, { label: string; actions: string[] }>;

export function getAction(pet: unknown, index: unknown) {
  if (!['dog', 'cat', 'other'].includes(String(pet)) || !Number.isInteger(index)) return undefined;
  return records.find((r) => r.pet === pet && r.index === index);
}

export function actionRequest(pet: PetType, index: number) {
  const action = getAction(pet, index);
  if (!action) throw new Error('Please select an available action.');
  return { petType: pet, action: index, actionId: action.id, actionLabel: action.label, actionCatalogVersion: ACTION_CATALOG_VERSION };
}
