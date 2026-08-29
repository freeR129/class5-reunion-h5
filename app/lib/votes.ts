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
  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

async function callRpc<T>(name: string, body: Record<string, unknown>): Promise<T> {
  if (!supabaseUrl || !supabaseAnonKey) throw new Error('Supabase voting is not configured');
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Vote request failed: ${response.status}`);
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
