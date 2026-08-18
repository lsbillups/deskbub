const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const vm = require('vm');
const { normalizeConfig, mergeConfig } = require('../pet-config');
const { loadStarterPet } = require('../starter-library');

test('old config receives the included Kaka starter without losing existing values', () => {
  const config = normalizeConfig({ opacity: 0.7, remindersPaused: true });
  assert.equal(config.opacity, 0.7);
  assert.equal(config.remindersPaused, true);
  assert.equal(config.petVisible, true);
  assert.deepEqual(config.pet, { mode: 'starter', starterId: 'kaka', pairingCode: null });
});

test('appearance patches preserve pairing and reminder configuration', () => {
  const paired = normalizeConfig({
    sitReminder: 30,
    remindersPaused: true,
    pet: { mode: 'paired', starterId: 'kaka', pairingCode: '123456' },
  });
  const updated = mergeConfig(paired, { opacity: 0.55, petSize: 1.25 });
  assert.equal(updated.sitReminder, 30);
  assert.equal(updated.remindersPaused, true);
  assert.deepEqual(updated.pet, paired.pet);
  assert.equal(updated.opacity, 0.55);
  assert.equal(updated.petSize, 1.25);
});

test('show or hide preference persists without changing other controls', () => {
  const hidden = mergeConfig(normalizeConfig({ sitReminder: 30 }), { petVisible: false });
  assert.equal(hidden.petVisible, false);
  assert.equal(hidden.sitReminder, 30);
  const visibleAgain = mergeConfig(hidden, { petVisible: true });
  assert.equal(visibleAgain.petVisible, true);
});

test('invalid pairing state safely falls back to Kaka', () => {
  const config = normalizeConfig({ pet: { mode: 'paired', pairingCode: '../bad' } });
  assert.deepEqual(config.pet, { mode: 'starter', starterId: 'kaka', pairingCode: null });
});

test('Kaka manifest resolves five existing local WebM actions', () => {
  const root = path.join(__dirname, '..', 'starter-pets');
  const kaka = loadStarterPet(root, 'kaka');
  assert.equal(kaka.id, 'kaka');
  assert.deepEqual(kaka.videos.map((video) => video.id), ['curious', 'relaxed', 'happy', 'lie-down', 'bouncy']);
  for (const video of kaka.videos) {
    assert.match(video.url, /^file:\/\//);
    assert.ok(fs.existsSync(new URL(video.url)), `${video.id} should exist`);
  }
});

test('desktop build copies starter pets outside the ASAR archive', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  const resource = packageJson.build.extraResources.find((entry) => entry.from === 'starter-pets');
  assert.ok(resource);
  assert.equal(resource.to, 'starter-pets');
  assert.deepEqual(resource.filter, ['**/*']);
});

test('desktop builds use a real cross-platform application icon', () => {
  const projectRoot = path.join(__dirname, '..');
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
  assert.equal(packageJson.build.win.icon, 'assets/app-icon.png');
  assert.equal(packageJson.build.mac.icon, 'assets/app-icon.png');
  const iconPath = path.join(projectRoot, packageJson.build.win.icon);
  assert.ok(fs.existsSync(iconPath));
  assert.ok(fs.statSync(iconPath).size > 100_000, 'application icon should not be a placeholder');
});

test('control panel inline script is valid JavaScript', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'renderer', 'settings.html'), 'utf8');
  const match = html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(match, 'settings.html should contain an inline control script');
  assert.doesNotThrow(() => new vm.Script(match[1]));
});
