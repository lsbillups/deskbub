'use client';

import { useState } from 'react';
import type { PetVideo } from '@/lib/dashboard';
import styles from './PetDashboard.module.css';

function VideoCard({ video }: { video: PetVideo }) {
  const [failed, setFailed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const download = async () => {
    if (downloading) return;
    setDownloading(true); setDownloadError('');
    try {
      const response = await fetch(video.url, { redirect: 'error', signal: AbortSignal.timeout(30_000) });
      if (!response.ok || Number(response.headers.get('content-length')) > 50 * 1024 * 1024) throw new Error('Download unavailable');
      const blob = await response.blob();
      if (!blob.size || blob.size > 50 * 1024 * 1024) throw new Error('Invalid saved video');
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = 'deskbub-' + video.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60) + '.webm';
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch { setDownloadError('The download could not finish. Please try again; your saved video is preserved.'); }
    finally { setDownloading(false); }
  };
  return <article className={styles.videoCard}>
    <div className={styles.player}>
      <video src={video.url} controls playsInline loop preload="metadata" aria-label={`${video.label} video preview`}
        onError={() => setFailed(true)} onPlay={event => {
          const current = event.currentTarget;
          current.closest('main')?.querySelectorAll('video').forEach(other => { if (other !== current) other.pause(); });
        }} />
      {failed && <p role="status" className={styles.mediaError}>This preview could not load. <a href={video.downloadUrl}>Download the saved video</a> or refresh to try again.</p>}
    </div>
    <div className={styles.videoInfo}>
      <h3>{video.label}</h3>
      <div className={styles.videoActions}>
        <button className={styles.download} disabled={downloading} onClick={() => void download()}>{downloading ? 'Downloading…' : 'Download video'} <span aria-hidden="true">↓</span></button>
      </div>
      {downloadError && <p role="alert" className={styles.mediaError}>{downloadError}</p>}
    </div>
  </article>;
}

export default function PetVideos({ videos, finalized }: { videos: PetVideo[]; finalized: boolean }) {
  return <section className={styles.gallery} aria-labelledby="pet-videos-title">
    <div className={styles.heading}><h2 id="pet-videos-title">Your Pet Videos</h2>{!finalized && <span>Not confirmed yet</span>}</div>
    <div className={styles.grid}>{videos.map(video => <VideoCard key={video.url} video={video} />)}</div>
  </section>;
}
