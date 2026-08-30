export type VoteStatus = 'attend' | 'absent' | 'maybe';

export type VoteResults = {
  attend: number;
  absent: number;
  maybe: number;
  total: number;
};

type VoteApiResponse = {
  success: boolean;
  results?: VoteResults;
  vote?: {voter_id: string; status: VoteStatus};
  error?: string;
  message?: string;
};

const voteApiUrl = 'https://class5-reunion-d1g39kiwl23892c7d-1477390775.ap-shanghai.app.tcloudbase.com/api/reunion-votes';
const voterIdStorageKey = 'reunion-voter-id';

function getVoterId() {
  const stored = localStorage.getItem(voterIdStorageKey);
  if (stored) return stored;
  const voterId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : createUuid();
  localStorage.setItem(voterIdStorageKey, voterId);
  return voterId;
}

function createUuid() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function requireVoteResults(value: VoteResults | undefined): VoteResults {
  if (!value || !Number.isFinite(value.attend) || !Number.isFinite(value.absent) || !Number.isFinite(value.maybe) || !Number.isFinite(value.total)) {
    console.error('[votes] CloudBase returned invalid vote results', value);
    throw new Error('CloudBase returned invalid vote results');
  }
  return value;
}

async function callVoteApi(body: Record<string, unknown>): Promise<VoteApiResponse> {
  let response: Response;
  try {
    response = await fetch(voteApiUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error('[votes] CloudBase network request failed', error);
    throw error;
  }
  const payload = await response.json().catch(() => null) as VoteApiResponse | null;
  if (!response.ok) {
    console.error(`[votes] CloudBase request failed with HTTP ${response.status}`, payload);
    throw new Error(payload?.message || payload?.error || `Vote request failed with HTTP ${response.status}`);
  }
  if (!payload?.success) {
    console.error('[votes] CloudBase rejected the vote request', payload);
    throw new Error(payload?.message || payload?.error || 'CloudBase vote request was not successful');
  }
  return payload;
}

export async function submitVote(status: VoteStatus): Promise<VoteResults> {
  const voterId = getVoterId();
  const payload = await callVoteApi({action: 'submit', voterId, status});
  if (payload.vote && (payload.vote.voter_id !== voterId || payload.vote.status !== status)) {
    console.error('[votes] CloudBase returned a mismatched vote confirmation', payload.vote);
    throw new Error('CloudBase returned a mismatched vote confirmation');
  }
  return requireVoteResults(payload.results);
}

export async function getVoteResults(): Promise<VoteResults> {
  const payload = await callVoteApi({action: 'results'});
  return requireVoteResults(payload.results);
}
