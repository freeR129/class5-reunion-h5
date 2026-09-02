const ENV_ID = "class5-reunion-d1g39kiwl23892c7d";

const RPC_BASE =
  `https://${ENV_ID}.api.tcloudbasegateway.com/v1/rdb/rest/rpc`;
const TABLE_BASE =
  `https://${ENV_ID}.api.tcloudbasegateway.com/v1/rdb/rest`;

const ALLOWED_ORIGINS = new Set([
  "https://class5-reunion-h5.netlify.app",
  "https://class5-reunion-h5.onrender.com",
  "https://class5reunion.top",
  "https://www.class5reunion.top"
]);

function requestOrigin(event) {
  const headers = event.headers || {};
  const originEntry = Object.entries(headers).find(
    ([name]) => name.toLowerCase() === "origin"
  );

  return typeof originEntry?.[1] === "string" ? originEntry[1] : "";
}

function corsHeaders(origin) {
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin"
  };

  if (ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

function httpResponse(body, statusCode = 200, origin = "") {
  return {
    statusCode,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json; charset=utf-8"
    },
    body: body === "" ? "" : JSON.stringify(body)
  };
}

function requestMethod(event) {
  return String(
    event.httpMethod ||
    event.method ||
    event.requestContext?.http?.method ||
    event.requestContext?.httpMethod ||
    ""
  ).toUpperCase();
}

async function callRpc(functionName, body = {}) {
  const publishableKey = process.env.TCB_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error("TCB_PUBLISHABLE_KEY is not configured");
  }

  const response = await fetch(`${RPC_BASE}/${functionName}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${publishableKey}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(body)
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `RPC ${functionName} failed: HTTP ${response.status} ${text}`
    );
  }

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function findVoteByVoterId(voterId) {
  const publishableKey = process.env.TCB_PUBLISHABLE_KEY;
  if (!publishableKey) {
    throw new Error("TCB_PUBLISHABLE_KEY is not configured");
  }
  const query = new URLSearchParams({
    voter_id: `eq.${voterId}`,
    select: "status",
    limit: "1"
  });
  const response = await fetch(`${TABLE_BASE}/reunion_votes?${query}`, {
    headers: {
      Authorization: `Bearer ${publishableKey}`,
      Accept: "application/json"
    }
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Vote lookup failed: HTTP ${response.status} ${text}`);
  }
  const rows = text ? JSON.parse(text) : [];
  return Array.isArray(rows) ? rows[0] ?? null : null;
}

function queryVoterId(event) {
  const query = event.queryStringParameters || event.query || {};
  if (typeof query.voterId === "string") {
    return query.voterId.trim();
  }
  const rawPath = String(event.rawPath || event.path || "");
  const rawQuery = String(event.rawQueryString || rawPath.split("?")[1] || "");
  return new URLSearchParams(rawQuery).get("voterId")?.trim() || "";
}

function firstRow(data) {
  if (Array.isArray(data)) {
    return data[0] ?? null;
  }
  return data;
}

exports.main = async (event = {}) => {
  const method = requestMethod(event);
  const origin = requestOrigin(event);
  const respond = (body, statusCode = 200) =>
    httpResponse(body, statusCode, origin);

  if (method === "OPTIONS") {
    return respond("", 204);
  }

  try {
    let data = event;

    if (typeof event.body === "string" && event.body.trim()) {
      try {
        data = JSON.parse(event.body);
      } catch {
        return respond({
          success: false,
          error: "invalid_json"
        }, 400);
      }
    }

    if (method === "GET" && !data.action) {
      const voterId = queryVoterId(event);
      data = voterId ? { action: "currentVote", voterId } : { action: "results" };
    }

    const action = data.action;
    if (action === "results") {
      const data = await callRpc("get_reunion_vote_results", {});

      return respond({
        success: true,
        results: firstRow(data)
      });
    }

    if (action === "currentVote") {
      const voterId = String(data.voterId || "").trim();
      if (!voterId) {
        return respond({success:false,error:"missing_voter_id"}, 400);
      }
      const vote = await findVoteByVoterId(voterId);
      const status = vote?.status;
      const voted = ["attend", "absent", "maybe"].includes(status);
      return respond({success:true,voted,status:voted ? status : null});
    }

    if (action === "submit") {
      const voterId = String(data.voterId || "").trim();
      const status = String(data.status || "").trim();
      if (!voterId) {
        return respond({
          success: false,
          error: "missing_voter_id"
        }, 400);
      }

      if (!["attend", "absent", "maybe"].includes(status)) {
        return respond({
          success: false,
          error: "invalid_status"
        }, 400);
      }

      const voteData = await callRpc("submit_reunion_vote", {
        p_voter_id: voterId,
        p_status: status
      });

      const totalsData = await callRpc(
        "get_reunion_vote_results",
        {}
      );

      return respond({
        success: true,
        vote: firstRow(voteData),
        results: firstRow(totalsData)
      });
    }

    return respond({
      success: false,
      error: "unknown_action"
    }, 400);
  } catch (error) {
    console.error("reunion-votes error:", error);

    return respond({
      success: false,
      error: "internal_error",
      message: error.message
    }, 500);
  }
};
