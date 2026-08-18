const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

function loadStarterPet(rootPath, starterId) {
  if (typeof starterId !== 'string' || !/^[a-z0-9-]+$/.test(starterId)) {
    throw new Error('Invalid starter pet id.');
  }

  const root = path.resolve(rootPath);
  const petDirectory = path.resolve(root, starterId);
  if (petDirectory !== path.join(root, starterId)) {
    throw new Error('Starter pet path escapes the library.');
  }

  const manifestPath = path.join(petDirectory, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.id !== starterId || !Array.isArray(manifest.actions) || manifest.actions.length === 0) {
    throw new Error(`Invalid manifest for starter pet: ${starterId}`);
  }

  const videos = manifest.actions.map((action) => {
    if (!action || typeof action.file !== 'string' || path.basename(action.file) !== action.file) {
      throw new Error(`Invalid action file in starter pet: ${starterId}`);
    }
    const filePath = path.join(petDirectory, action.file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing starter action: ${action.file}`);
    }
    return {
      id: String(action.id || path.parse(action.file).name),
      label: String(action.label || 'Kaka action'),
      url: pathToFileURL(filePath).href,
    };
  });

  return {
    id: manifest.id,
    name: String(manifest.name || starterId),
    version: Number(manifest.version) || 1,
    videos,
  };
}

module.exports = { loadStarterPet };
