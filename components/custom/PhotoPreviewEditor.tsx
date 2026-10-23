'use client';

import styles from './PhotoPreviewEditor.module.css';

type Props = {
  files: File[];
  urls: string[];
  maxFiles: number;
  disabled?: boolean;
  onAddPhotos: (files: File[]) => Promise<void>;
  onRemovePhoto: (index: number) => Promise<void>;
};

export default function PhotoPreviewEditor({ files, urls, maxFiles, disabled = false, onAddPhotos, onRemovePhoto }: Props) {
  const multiple = maxFiles > 1;
  return <div className={styles.editor}>
    <div className={styles.summary}>
      <p>{files.length} of {maxFiles} photo{maxFiles === 1 ? '' : 's'} selected</p>
      <span>{multiple ? 'Add up to 5 photos before removing the background.' : 'Basic uses one photo.'}</span>
    </div>
    <div className={styles.photos}>
      {files.map((file, index) => <div key={`${file.name}-${index}`} className={styles.photo}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={urls[index]} alt={`Selected pet photo ${index + 1}`} />
        <button type="button" disabled={disabled} aria-label={`Remove photo ${index + 1}`} onClick={() => void onRemovePhoto(index)}>Remove</button>
      </div>)}
    </div>
    {(!multiple || files.length < maxFiles) && <label className={`${styles.add} ${disabled ? styles.disabled : ''}`}>
      <input type="file" accept="image/jpeg,image/png,image/webp" multiple={multiple} disabled={disabled}
        aria-label={multiple ? 'Add pet photos' : 'Replace pet photo'}
        onChange={event => { const chosen = Array.from(event.currentTarget.files || []); event.currentTarget.value = ''; if (chosen.length) void onAddPhotos(chosen); }} />
      <span>{multiple ? 'Add photos' : 'Replace photo'}</span>
      <small>{multiple ? `${maxFiles - files.length} more available · ` : ''}JPG, PNG, WebP · Up to 10 MB each</small>
    </label>}
  </div>;
}
