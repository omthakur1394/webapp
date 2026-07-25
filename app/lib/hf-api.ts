const DEFAULT_HF_CHAT_URL = 'https://omthakur1394-shopease-self-rag.hf.space/chat';

export function getHfChatUrl(): string {
  return process.env.HF_API_CHAT_URL || process.env.HF_API_URL || DEFAULT_HF_CHAT_URL;
}

export function getHfOrderUrl(): string {
  const orderUrl = process.env.HF_API_ORDER_URL || process.env.HF_ORDER_URL;
  if (orderUrl) return orderUrl;

  const chatUrl = getHfChatUrl();
  if (chatUrl.match(/\/chat\/?$/i)) {
    return chatUrl.replace(/\/chat\/?$/i, '/order');
  }
  return `${chatUrl.replace(/\/+$/, '')}/order`;
}

function getHfTokenUrl(): string {
  const chatUrl = getHfChatUrl();
  const base = chatUrl.match(/\/chat\/?$/i)
    ? chatUrl.replace(/\/chat\/?$/i, '')
    : chatUrl.replace(/\/+$/, '');
  return `${base}/token`;
}

let cachedAccessToken: string | null = null;

function getStaticHfToken(): string {
  return process.env.HF_TOKEN || process.env.HF_HUB_TOKEN || '';
}

async function requestAccessToken(): Promise<string | null> {
  const staticToken = getStaticHfToken();
  if (staticToken) return staticToken;

  const username = process.env.HF_API_USERNAME || 'webapp';
  const password = process.env.HF_API_PASSWORD || 'webapp';
  const tokenUrl = getHfTokenUrl();

  const body = new URLSearchParams({
    username,
    password,
    grant_type: 'password',
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.warn('HF /token returned status', response.status, detail.slice(0, 200));
    return null;
  }

  const data = await response.json();
  return typeof data.access_token === 'string' ? data.access_token : null;
}

async function getAccessToken(forceRefresh = false): Promise<string | null> {
  if (getStaticHfToken()) return getStaticHfToken();
  if (!forceRefresh && cachedAccessToken) return cachedAccessToken;

  const token = await requestAccessToken();
  if (token && !getStaticHfToken()) {
    cachedAccessToken = token;
  }
  return token;
}

export async function buildHfAuthHeaders(
  incomingAuth?: string | null
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (incomingAuth) {
    headers.Authorization = incomingAuth;
    return headers;
  }

  const token = await getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export async function hfPost(
  url: string,
  payload: Record<string, unknown>,
  incomingAuth?: string | null
): Promise<Response> {
  let headers = await buildHfAuthHeaders(incomingAuth);
  let response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (response.status === 401 && !incomingAuth && !getStaticHfToken()) {
    cachedAccessToken = null;
    headers = await buildHfAuthHeaders(null);
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  }

  return response;
}
