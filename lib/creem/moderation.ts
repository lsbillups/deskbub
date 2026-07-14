/**
 * Screen a prompt through Creem's Moderation API before AI generation.
 * Required for Creem compliance — all AI image/video products must integrate.
 * https://docs.creem.io/features/moderation
 */

const CREEM_BASE = process.env.CREEM_API_KEY?.startsWith('creem_test')
  ? 'https://test-api.creem.io'
  : 'https://api.creem.io';

export async function screenPrompt(prompt: string, userId: string): Promise<{ passed: boolean; error?: string }> {
  if (!process.env.CREEM_API_KEY) {
    // No Creem key configured — allow through in dev, block in prod
    if (process.env.NODE_ENV === 'production') {
      return { passed: false, error: 'Moderation not configured.' };
    }
    return { passed: true };
  }

  try {
    const res = await fetch(`${CREEM_BASE}/v1/moderation/prompt`, {
      method: 'POST',
      headers: {
        'x-api-key': process.env.CREEM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        external_id: `user_${userId}`,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.error('Moderation API error:', res.status);
      // Fail closed — don't generate if we can't verify
      return { passed: false, error: 'Unable to verify content. Please try again.' };
    }

    const result = await res.json();

    if (result.decision === 'deny' || result.decision === 'flag') {
      return { passed: false, error: 'This content was flagged by our safety system. Please try a different photo.' };
    }

    return { passed: true };
  } catch (err) {
    console.error('Moderation call failed:', err);
    // Fail closed
    return { passed: false, error: 'Content check failed. Please try again.' };
  }
}
