export type VoteStatus = 'attend' | 'absent' | 'maybe';

export type VoteResults = {
  attend: number;
  absent: number;
  maybe: number;
};

const env = (import.meta as ImportMeta & {env?: Record<string, string | undefined>}).env ?? {};
const supabaseUrl = env.VITE_SUPABASE_URL?.replace(/\/$/, '');
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseVoteConfigured = Boolean(supabaseUrl && supabaseAnonKey);

function getVoterId() {
  const key = 'reunion-voter-id';
  const stored = localStorage.getItem(key);
  if (stored) return stored;
  const id = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : createUuid();
  localStorage.setItem(key, id);
  return id;
}

function createUuid() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function callRpc<T>(name: string, body: Record<string, unknown>): Promise<T> {
  if (!supabaseUrl || !supabaseAnonKey) {
    const error = new Error('Supabase voting is not configured');
    console.error(`[votes] RPC ${name} was not sent: missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY`);
    throw error;
  }
  let response: Response;
  try {
    response = await fetch(`${supabaseUrl}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error(`[votes] RPC ${name} network request failed`, error);
    throw error;
  }
  if (!response.ok) {
    const details = await response.text().catch(() => '');
    console.error(`[votes] RPC ${name} failed with HTTP ${response.status}`, details);
    throw new Error(`Vote RPC ${name} failed with HTTP ${response.status}`);
  }
  const data = await response.json();
  return (Array.isArray(data) ? data[0] : data) as T;
}

// Stable public interface used by the H5. One anonymous device owns one vote.
export function submitVote(status: VoteStatus): Promise<VoteResults> {
  return callRpc<VoteResults>('submit_reunion_vote', {
    p_voter_id: getVoterId(),
    p_status: status,
  });
}

export function getVoteResults(): Promise<VoteResults> {
  return callRpc<VoteResults>('get_reunion_vote_results', {});
}
