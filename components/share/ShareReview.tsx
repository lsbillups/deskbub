'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ShareClaim } from '@/lib/share-claims';
import styles from './ShareReview.module.css';
type Claim = ShareClaim & { email: string; user_id: string; revision: number };
type Queue = { claims: Claim[]; granted: number; total: number; enabled: boolean; staging: boolean };
export default function ShareReview() {
  const [filter, setFilter] = useState('pending'), [data, setData] = useState<Queue | null>(null);
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false), [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null), [notes, setNotes] = useState<Record<string,string>>({});
  const latest = useRef(0);
  const load = useCallback(async () => {
    const sequence = ++latest.current;
    try { const response = await fetch('/api/admin/share-claims?status=' + filter, { cache: 'no-store' });
      const value = await response.json(); if (!response.ok) throw new Error(value.error);
      if (sequence === latest.current) { setError(''); setData(value); }
    } catch (e) { if (sequence === latest.current) { setError((e as Error).message); setData(null); } }
    finally { if (sequence === latest.current) setLoading(false); }
  }, [filter]);
  useEffect(() => {
    const sequence = ++latest.current;
    let canceled = false;
    fetch('/api/admin/share-claims?status=' + filter, { cache: 'no-store' }).then(async response => {
      const value = await response.json(); if (!response.ok) throw new Error(value.error); return value;
    }).then(value => { if (!canceled && sequence === latest.current) { setError(''); setData(value); } })
      .catch(e => { if (!canceled && sequence === latest.current) { setError(e.message); setData(null); } })
      .finally(() => { if (!canceled && sequence === latest.current) setLoading(false); });
    return () => { canceled = true; };
  }, [filter]);
  async function review(claim: Claim, decision: string) {
    if (busy) return; setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/admin/share-claims', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: claim.id, decision, note: notes[claim.id] || '', revision: claim.revision }) });
      const value = await response.json(); if (!response.ok) throw new Error(value.error);
      setSelected(null); setNotice(decision === 'approved' ? 'Approved. One Basic generation was granted.' : 'Returned to the applicant with your note.');
      await load();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <div className={styles.queue}>
    <div className={styles.toolbar}><div className={styles.filters} role="group" aria-label="Application status">
      {['pending','changes_requested','approved'].map(value => <button type="button" key={value} aria-pressed={filter === value} disabled={busy} onClick={() => { if (value !== filter) { setLoading(true); setSelected(null); setFilter(value); setNotice(''); } }}>{value === 'pending' ? '待审核' : value === 'changes_requested' ? '已退回' : '已发放'}</button>)}
    </div><button className={styles.refresh} type="button" onClick={() => { setLoading(true); void load(); }} disabled={busy || loading}>刷新</button></div>
    {data?.staging && <p className={styles.test}>Staging · 仅本地测试申请和额度，真实模型生成仍关闭。</p>}
    {data && <p className={styles.summary}>共发放 {data.granted} 次 Basic · 当前筛选 {data.total} 条{data.total > 100 ? '（显示最近100条）' : ''}{!data.enabled ? ' · 活动关闭，无法提交或发奖' : ''}</p>}
    {error && <p role="alert" className={styles.error}>{error}</p>}{notice && <p role="status" className={styles.notice}>{notice}</p>}
    {loading ? <p role="status">加载申请中…</p> : data && !data.claims.length ? <p className={styles.empty}>这里暂时没有申请。</p> : data?.claims.map(claim => <article className={styles.item} key={claim.id}>
      <div className={styles.identity}><h2>{claim.email}</h2><span>{claim.platform === 'x' ? 'X' : claim.platform === 'tiktok' ? 'TikTok' : 'Instagram'} · {claim.social_handle}</span></div>
      <p className={styles.meta}>提交于 {new Date(claim.created_at).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}（北京时间）{claim.reviewed_at && ' · 已审核'}</p>
      <a href={claim.post_url} target="_blank" rel="noopener noreferrer" className={styles.post}>打开帖子核查 <span aria-hidden="true">↗</span></a>
      {claim.review_note && <p className={styles.meta}>审核备注：{claim.review_note}</p>}
      {claim.status === 'pending' && <>
        <p className={styles.checklist}>核对：本人账号、公开帖子、包含 DeskBub 内容与奖励披露。通过后发放 1 次 Basic。</p>
        <label htmlFor={'note-' + claim.id}>退回原因 / 审核备注</label><textarea id={'note-' + claim.id} rows={2} maxLength={500} value={notes[claim.id] || ''} disabled={busy} onChange={e => setNotes({ ...notes, [claim.id]: e.target.value })} placeholder="退回时必填；用户可以看到这段文字" />
        {selected === claim.id ? <div className={styles.actions}><span>确认发放一次 Basic？</span><button type="button" disabled={busy || !data.enabled} className={styles.approve} onClick={() => void review(claim, 'approved')}>{busy ? '发放中…' : '确认发放'}</button><button type="button" disabled={busy} onClick={() => setSelected(null)}>取消</button></div> :
        <div className={styles.actions}><button type="button" disabled={busy || !data.enabled} className={styles.approve} onClick={() => setSelected(claim.id)}>通过并发放</button><button type="button" disabled={busy || !data.enabled || !notes[claim.id]?.trim()} onClick={() => void review(claim, 'changes_requested')}>退回修改</button></div>}
      </>}
    </article>)}
  </div>;
}
