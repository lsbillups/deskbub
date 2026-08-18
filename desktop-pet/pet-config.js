const DEFAULT_CONFIG = Object.freeze({
  sitReminder: 50,
  waterReminder: 90,
  opacity: 0.9,
  petSize: 1,
  petVisible: true,
  remindersPaused: false,
  welcomeSeen: false,
  pet: Object.freeze({
    mode: 'starter',
    starterId: 'kaka',
    pairingCode: null,
  }),
});

function clamp(value, min, max, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

function normalizePet(pet) {
  const source = pet && typeof pet === 'object' ? pet : {};
  const pairingCode = typeof source.pairingCode === 'string' && /^\d{6}$/.test(source.pairingCode)
    ? source.pairingCode
    : null;
  const wantsPaired = source.mode === 'paired' && pairingCode;

  return {
    mode: wantsPaired ? 'paired' : 'starter',
    starterId: typeof source.starterId === 'string' && /^[a-z0-9-]+$/.test(source.starterId)
      ? source.starterId
      : 'kaka',
    pairingCode: wantsPaired ? pairingCode : null,
  };
}

function normalizeConfig(config) {
  const source = config && typeof config === 'object' ? config : {};
  return {
    ...DEFAULT_CONFIG,
    ...source,
    opacity: clamp(source.opacity, 0.3, 1, DEFAULT_CONFIG.opacity),
    petSize: clamp(source.petSize, 0.5, 1.5, DEFAULT_CONFIG.petSize),
    petVisible: typeof source.petVisible === 'boolean' ? source.petVisible : DEFAULT_CONFIG.petVisible,
    remindersPaused: Boolean(source.remindersPaused),
    welcomeSeen: Boolean(source.welcomeSeen),
    pet: normalizePet(source.pet),
  };
}

function mergeConfig(current, patch) {
  const base = normalizeConfig(current);
  const update = patch && typeof patch === 'object' ? patch : {};
  return normalizeConfig({
    ...base,
    ...update,
    pet: {
      ...base.pet,
      ...(update.pet && typeof update.pet === 'object' ? update.pet : {}),
    },
  });
}

module.exports = { DEFAULT_CONFIG, normalizeConfig, mergeConfig };
