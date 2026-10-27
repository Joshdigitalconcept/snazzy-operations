import 'dotenv/config';

function cleanCloudinaryEnv() {
  if (
    process.env.CLOUDINARY_URL &&
    (process.env.CLOUDINARY_URL.startsWith('CLOUDINARY_URL=') ||
      process.env.CLOUDINARY_URL.includes('<your_api_key>') ||
      !process.env.CLOUDINARY_URL.startsWith('cloudinary://'))
  ) {
    const cleaned = process.env.CLOUDINARY_URL.replace(/^CLOUDINARY_URL=/i, '').replace(/^["']|["']$/g, '').trim();
    if (cleaned.startsWith('cloudinary://') && !cleaned.includes('<your_api_key>')) {
      process.env.CLOUDINARY_URL = cleaned;
    } else {
      delete process.env.CLOUDINARY_URL;
    }
  }
}
cleanCloudinaryEnv();

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';


// Asynchronously load Cloudinary SDK on demand after environment variable sanitization
async function getCloudinary(): Promise<any> {
  cleanCloudinaryEnv();
  const cld = await import('cloudinary');
  return cld.v2 || (cld as any).default?.v2 || cld;
}

const app = express();
const PORT = 3000;

// Global CORS headers and OPTIONS preflight handler for iframe & cross-origin safety
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Normalize API routes if Vercel serverless environment stripped the /api prefix
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (
    req.url &&
    (req.url.startsWith('/cloudinary') || req.url.startsWith('/workdrive') || req.url.startsWith('/health'))
  ) {
    req.url = '/api' + req.url;
  }
  next();
});

// Increase body parsing limits for metadata
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// In-memory upload storage for files up to 100MB
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

// Safe JSON parser helper to prevent "Unexpected token '<'" exceptions
async function safeJsonFetch(res: any): Promise<{ ok: boolean; status: number; data: any; text: string }> {
  try {
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      return { ok: res.ok, status: res.status, data, text };
    } catch {
      return { ok: false, status: res.status, data: null, text };
    }
  } catch (err: any) {
    return { ok: false, status: 0, data: null, text: err?.message || 'Network error' };
  }
}

// Server-side persistent storage for Zoho WorkDrive configuration
interface ServerWorkDriveConfig {
  enabled?: boolean;
  rootFolder?: string;
  autoCycleFolder?: boolean;
  namingConvention?: string;
  useDepartmentCode?: boolean;
  zohoDomain?: string;
  parentFolderId?: string;
  workspaceId?: string;
  teamFolderName?: string;
  teamFolderId?: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  redirectUri?: string;
  connected?: boolean;
  lastSyncedAt?: string;
}

const CONFIG_FILE = path.join(process.cwd(), '.workdrive-config.json');

function loadServerWorkDriveConfig(): ServerWorkDriveConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Notice reading .workdrive-config.json:', e);
  }
  return {
    enabled: false,
    rootFolder: 'Deliverables',
    autoCycleFolder: true,
    zohoDomain: 'zoho.com',
    parentFolderId: '6p1w1d9fdf7f349244201bd98bea82e968be5',
    workspaceId: '4imj816429a4baa7747aa814b03cdbe7b2c2c',
    teamFolderName: 'Company Deliverables Drive',
    connected: false,
  };
}

let serverWorkDriveConfig = loadServerWorkDriveConfig();

function saveServerWorkDriveConfig(updates: Partial<ServerWorkDriveConfig>) {
  // CRITICAL: If updates.refreshToken is empty, preserve existing valid refreshToken!
  const effectiveRefreshToken =
    updates.refreshToken === 'CLEARED'
      ? ''
      : (updates.refreshToken && updates.refreshToken.trim().length > 0)
      ? updates.refreshToken.trim()
      : (serverWorkDriveConfig.refreshToken || '');

  const effectiveClientId =
    (updates.clientId && updates.clientId.trim().length > 0)
      ? updates.clientId.trim()
      : (serverWorkDriveConfig.clientId || '');

  const effectiveClientSecret =
    (updates.clientSecret && updates.clientSecret.trim().length > 0)
      ? updates.clientSecret.trim()
      : (serverWorkDriveConfig.clientSecret || '');

  serverWorkDriveConfig = {
    ...serverWorkDriveConfig,
    ...updates,
    clientId: effectiveClientId,
    clientSecret: effectiveClientSecret,
    refreshToken: effectiveRefreshToken,
    lastSyncedAt: new Date().toISOString(),
  };

  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(serverWorkDriveConfig, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing .workdrive-config.json:', e);
  }
  return serverWorkDriveConfig;
}

function getZohoApiDomain(domain: string = 'zoho.com') {
  const clean = domain.toLowerCase().trim();
  if (clean.includes('zoho.eu')) return 'https://www.zohoapis.eu';
  if (clean.includes('zoho.in')) return 'https://www.zohoapis.in';
  if (clean.includes('zoho.com.au')) return 'https://www.zohoapis.com.au';
  if (clean.includes('zoho.jp')) return 'https://www.zohoapis.jp';
  return 'https://www.zohoapis.com';
}

function getZohoAccountsDomain(domain: string = 'zoho.com') {
  const clean = domain.toLowerCase().trim();
  if (clean.includes('zoho.eu')) return 'https://accounts.zoho.eu';
  if (clean.includes('zoho.in')) return 'https://accounts.zoho.in';
  if (clean.includes('zoho.com.au')) return 'https://accounts.zoho.com.au';
  if (clean.includes('zoho.jp')) return 'https://accounts.zoho.jp';
  return 'https://accounts.zoho.com';
}

// In-memory token cache to prevent hitting Zoho rate limits on token refreshes
let cachedAccessToken: { token: string; expiresAt: number; key: string } | null = null;

async function getOrRefreshZohoAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
  domain: string = 'zoho.com'
): Promise<{ ok: boolean; accessToken?: string; error?: string; details?: string }> {
  const cacheKey = `${clientId}:${refreshToken}:${domain}`;
  const now = Date.now();

  // If token is cached and has at least 5 minutes before expiring, reuse it!
  if (cachedAccessToken && cachedAccessToken.key === cacheKey && cachedAccessToken.expiresAt > now + 300000) {
    return { ok: true, accessToken: cachedAccessToken.token };
  }

  const accountsDomain = getZohoAccountsDomain(domain);
  const bodyParams = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });

  const tokenRes = await fetch(`${accountsDomain}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: bodyParams.toString(),
  });

  const tokenResult = await safeJsonFetch(tokenRes);
  const tokenData = tokenResult.data;

  if (!tokenResult.ok || !tokenData || tokenData.error || !tokenData.access_token) {
    return {
      ok: false,
      error: 'Failed to authenticate with Zoho using provided Refresh Token.',
      details: tokenData?.error_description || tokenData?.error || tokenResult.text.slice(0, 200),
    };
  }

  const expiresInSec = tokenData.expires_in || 3600;
  cachedAccessToken = {
    token: tokenData.access_token,
    expiresAt: now + expiresInSec * 1000,
    key: cacheKey,
  };

  return { ok: true, accessToken: tokenData.access_token };
}

/**
 * Exchange Authorization Code for Refresh Token
 */
app.post('/api/workdrive/exchange-code', async (req: Request, res: Response) => {
  try {
    const { code, clientId, clientSecret, redirectUri, domain } = req.body;

    if (!code || !clientId || !clientSecret) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: code, clientId, and clientSecret are mandatory.',
      });
    }

    const accountsDomain = getZohoAccountsDomain(domain);
    const tokenUrl = `${accountsDomain}/oauth/v2/token`;

    const tryExchange = async (includeRedirect: boolean) => {
      const bodyParams = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId.trim(),
        client_secret: clientSecret.trim(),
        code: code.trim(),
      });
      if (includeRedirect && redirectUri?.trim()) {
        bodyParams.append('redirect_uri', redirectUri.trim());
      }

      console.log(`[Zoho OAuth] Attempting exchange (includeRedirect: ${includeRedirect}, url: ${tokenUrl})`);

      const zohoRes = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      });

      const zohoJson = await safeJsonFetch(zohoRes);
      return zohoJson.data || { error: 'invalid_response', error_description: zohoJson.text.slice(0, 200) };
    };

    // First attempt with redirect URI if provided
    let zohoData = await tryExchange(Boolean(redirectUri?.trim()));
    console.log('[Zoho OAuth] Initial response:', zohoData);

    // If it failed because of redirect_uri_mismatch or invalid_code, try without redirect_uri
    if (zohoData.error && redirectUri?.trim()) {
      console.log('[Zoho OAuth] Retrying exchange without redirect_uri...');
      const retryData = await tryExchange(false);
      console.log('[Zoho OAuth] Retry response:', retryData);
      if (!retryData.error && retryData.refresh_token) {
        zohoData = retryData;
      }
    }

    if (zohoData.error) {
      return res.status(400).json({
        success: false,
        error: zohoData.error,
        details: zohoData.error_description || 'Zoho rejected the authorization code.',
      });
    }

    if (!zohoData.refresh_token) {
      return res.status(400).json({
        success: false,
        error: 'No refresh token returned by Zoho.',
        details:
          'Zoho did not return a refresh token. The code may have already been used (codes are single-use) or expired (10 min lifetime). Please generate a fresh code in Zoho Developer Console and try again.',
        data: zohoData,
      });
    }

    // Persist to serverConfig immediately so it survives restarts, page reloads, and different user sessions
    saveServerWorkDriveConfig({
      clientId: clientId.trim(),
      clientSecret: clientSecret.trim(),
      refreshToken: zohoData.refresh_token,
      redirectUri: redirectUri?.trim(),
      zohoDomain: domain || 'zoho.com',
      connected: true,
    });

    return res.json({
      success: true,
      refreshToken: zohoData.refresh_token,
      accessToken: zohoData.access_token,
      apiDomain: zohoData.api_domain,
      expiresIn: zohoData.expires_in,
    });
  } catch (error: any) {
    console.error('Error exchanging Zoho code:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error during token exchange.',
    });
  }
});

/**
 * Get current WorkDrive configuration
 */
app.get('/api/workdrive/config', (_req: Request, res: Response) => {
  res.json({
    success: true,
    config: {
      ...serverWorkDriveConfig,
      hasRefreshToken: Boolean(serverWorkDriveConfig.refreshToken),
    },
  });
});

/**
 * Save or update WorkDrive configuration
 */
app.post('/api/workdrive/config', (req: Request, res: Response) => {
  try {
    const updates = req.body || {};
    const updated = saveServerWorkDriveConfig(updates);
    res.json({
      success: true,
      config: {
        ...updated,
        hasRefreshToken: Boolean(updated.refreshToken),
      },
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * Direct OAuth Callback Receiver for browser popups / redirects
 */
app.get('/oauth/callback', (req: Request, res: Response) => {
  const code = (req.query.code as string) || '';
  const error = (req.query.error as string) || '';
  const errorDesc = (req.query.error_description as string) || '';

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Zoho WorkDrive Authorization</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0f172a; color: #f8fafc; }
      .card { background: #1e293b; padding: 2.5rem; border-radius: 1.25rem; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.5); max-width: 460px; text-align: center; border: 1px solid #334155; }
      h2 { margin-top: 0; color: #38bdf8; font-size: 1.35rem; }
      .code-box { font-family: monospace; background: #0f172a; color: #38bdf8; padding: 0.75rem; border-radius: 0.5rem; word-break: break-all; font-size: 0.8rem; margin: 1rem 0; border: 1px solid #334155; }
      p { font-size: 0.9rem; color: #94a3b8; line-height: 1.5; }
      .success-icon { width: 48px; height: 48px; margin: 0 auto 1rem; color: #10b981; }
    </style>
  </head>
  <body>
    <div class="card">
      ${code ? `
        <svg class="success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        <h2>Zoho Authorization Granted!</h2>
        <p>Your authorization code has been received from Zoho. Connecting to Snazzy Operations...</p>
        <div class="code-box">${code}</div>
        <p>This popup will close automatically.</p>
        <script>
          try {
            if (window.opener) {
              window.opener.postMessage({ type: 'ZOHO_AUTH_CODE', code: '${code}' }, '*');
              setTimeout(() => window.close(), 1000);
            } else {
              window.location.href = '/?zoho_code=' + encodeURIComponent('${code}');
            }
          } catch(e) {
            console.error(e);
          }
        </script>
      ` : `
        <h2 style="color: #ef4444;">Authorization Canceled or Failed</h2>
        <p>${error || 'No authorization code was returned by Zoho.'}</p>
        <p style="font-size: 0.8rem; color: #cbd5e1;">${errorDesc}</p>
      `}
    </div>
  </body>
</html>`;

  res.send(html);
});

/**
 * Test Connection & Verify Refresh Token
 */
app.post('/api/workdrive/test-connection', async (req: Request, res: Response) => {
  try {
    const { clientId, clientSecret, refreshToken, parentFolderId, domain } = req.body;

    const activeClientId = (clientId || serverWorkDriveConfig.clientId || process.env.ZOHO_CLIENT_ID || '').trim();
    const activeClientSecret = (clientSecret || serverWorkDriveConfig.clientSecret || process.env.ZOHO_CLIENT_SECRET || '').trim();
    const activeRefreshToken = (refreshToken || serverWorkDriveConfig.refreshToken || process.env.ZOHO_REFRESH_TOKEN || '').trim();
    const activeDomain = (domain || serverWorkDriveConfig.zohoDomain || 'zoho.com').trim();
    const activeParentFolderId = (parentFolderId || serverWorkDriveConfig.parentFolderId || '6p1w1d9fdf7f349244201bd98bea82e968be5').trim();

    if (!activeClientId || !activeClientSecret || !activeRefreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing credentials. Please supply Client ID, Client Secret, and Refresh Token.',
      });
    }

    // 1. Get Access Token (using cache to protect against rate limits)
    const tokenResult = await getOrRefreshZohoAccessToken(
      activeClientId,
      activeClientSecret,
      activeRefreshToken,
      activeDomain
    );

    if (!tokenResult.ok || !tokenResult.accessToken) {
      return res.status(400).json({
        success: false,
        error: tokenResult.error || 'Failed to authenticate with Zoho using provided Refresh Token.',
        details: tokenResult.details,
      });
    }

    const accessToken = tokenResult.accessToken;
    const apiDomain = getZohoApiDomain(activeDomain);

    // 2. Fetch User Profile
    const userRes = await fetch(`${apiDomain}/workdrive/api/v1/users/me`, {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        Accept: 'application/vnd.api+json',
      },
    });

    const userResult = await safeJsonFetch(userRes);
    const userData: any = userResult.data;

    // 3. Inspect target Deliverables folder if provided
    let folderData: any = null;
    const targetFolderId = activeParentFolderId;
    if (targetFolderId) {
      const folderRes = await fetch(`${apiDomain}/workdrive/api/v1/files/${targetFolderId}`, {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          Accept: 'application/vnd.api+json',
        },
      });
      const folderResult = await safeJsonFetch(folderRes);
      folderData = folderResult.data;
    }

    // Automatically lock in these verified credentials on the server
    saveServerWorkDriveConfig({
      clientId: activeClientId,
      clientSecret: activeClientSecret,
      refreshToken: activeRefreshToken,
      zohoDomain: activeDomain,
      parentFolderId: targetFolderId,
      connected: true,
    });

    return res.json({
      success: true,
      message: 'Connection to Zoho WorkDrive successful!',
      user: userData?.data?.attributes?.name || userData?.data?.attributes?.email || 'Authorized User',
      organization: userData?.data?.attributes?.team_name || 'Zoho WorkDrive Team',
      folderId: targetFolderId,
      folderName: folderData?.data?.attributes?.name || 'Deliverables Folder',
      folderStatus: folderData ? 'Verified Access' : 'ID Accessible',
    });
  } catch (error: any) {
    console.error('Error testing Zoho connection:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Error occurred while verifying Zoho connection.',
    });
  }
});

/**
 * Real Physical File Upload to Zoho WorkDrive
 */
app.post('/api/workdrive/upload', (req: Request, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      console.error('Multer file upload error:', err);
      return res.status(400).json({
        success: false,
        error: err.message || 'Error processing uploaded file.',
      });
    }
    next();
  });
}, async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, error: 'No file was uploaded.' });
    }

    const {
      clientId,
      clientSecret,
      refreshToken,
      parentFolderId,
      workspaceId: rawWorkspaceId,
      cycleFolder,
      formattedFileName,
      domain,
    } = req.body;

    const activeClientId = (clientId || serverWorkDriveConfig.clientId || process.env.ZOHO_CLIENT_ID || '').trim();
    const activeClientSecret = (clientSecret || serverWorkDriveConfig.clientSecret || process.env.ZOHO_CLIENT_SECRET || '').trim();
    const activeRefreshToken = (refreshToken || serverWorkDriveConfig.refreshToken || process.env.ZOHO_REFRESH_TOKEN || '').trim();
    const activeDomain = (domain || serverWorkDriveConfig.zohoDomain || 'zoho.com').trim();
    const activeParentFolderId = (parentFolderId || serverWorkDriveConfig.parentFolderId || '6p1w1d9fdf7f349244201bd98bea82e968be5').trim();
    const activeWorkspaceId = (rawWorkspaceId || serverWorkDriveConfig.workspaceId || '4imj816429a4baa7747aa814b03cdbe7b2c2c').trim();

    if (!activeClientId || !activeClientSecret || !activeRefreshToken) {
      return res.status(400).json({
        success: false,
        error: 'WorkDrive credentials not configured. Please enter Client ID, Client Secret, and Refresh Token in Admin settings.',
      });
    }

    const rootParentId = activeParentFolderId;
    const finalFileName = (formattedFileName || file.originalname || 'deliverable.pdf').trim();
    const targetCycleFolder = (cycleFolder || 'Cycle-Current').trim();

    // 1. Get or Refresh Access Token (cached to prevent rate-limit failures)
    const tokenResult = await getOrRefreshZohoAccessToken(
      activeClientId,
      activeClientSecret,
      activeRefreshToken,
      activeDomain
    );

    if (!tokenResult.ok || !tokenResult.accessToken) {
      return res.status(400).json({
        success: false,
        error: tokenResult.error || 'Failed to authenticate with Zoho using provided Refresh Token.',
        details: tokenResult.details,
      });
    }

    const accessToken = tokenResult.accessToken;
    const apiDomain = getZohoApiDomain(activeDomain);

    // 2. Find or Create Cycle Subfolder inside parentFolderId
    let destinationFolderId = rootParentId;

    try {
      // List existing files/folders inside parent
      const listRes = await fetch(`${apiDomain}/workdrive/api/v1/files/${rootParentId}/files?page%5Bsize%5D=50`, {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          Accept: 'application/vnd.api+json',
        },
      });

      const listResult = await safeJsonFetch(listRes);
      if (listResult.ok && listResult.data) {
        const listData = listResult.data;
        const existingFolders = (listData.data || []).filter(
          (item: any) => item.attributes?.type === 'folder' || item.type === 'files'
        );
        const match = existingFolders.find(
          (f: any) => f.attributes?.name?.trim().toLowerCase() === targetCycleFolder.toLowerCase()
        );

        if (match && match.id) {
          destinationFolderId = match.id;
        } else {
          // Create subfolder
          const createFolderRes = await fetch(`${apiDomain}/workdrive/api/v1/files`, {
            method: 'POST',
            headers: {
              Authorization: `Zoho-oauthtoken ${accessToken}`,
              'Content-Type': 'application/vnd.api+json',
              Accept: 'application/vnd.api+json',
            },
            body: JSON.stringify({
              data: {
                attributes: {
                  name: targetCycleFolder,
                  parent_id: rootParentId,
                },
                type: 'files',
              },
            }),
          });

          const createResult = await safeJsonFetch(createFolderRes);
          if (createResult.ok && createResult.data?.data?.id) {
            destinationFolderId = createResult.data.data.id;
          } else {
            console.error('Failed to create cycle subfolder:', createResult.text);
            return res.status(500).json({
              success: false,
              error: `Could not create cycle folder "${targetCycleFolder}" in Zoho WorkDrive.`,
              details: createResult.data?.error || createResult.text.slice(0, 200),
            });
          }
        }
      } else {
        console.error('Failed to query files inside root parent folder:', listResult.text);
      }
    } catch (folderErr: any) {
      console.error('Could not list or create cycle folder:', folderErr);
      return res.status(500).json({
        success: false,
        error: `Could not verify or create cycle folder "${targetCycleFolder}" in Zoho WorkDrive.`,
        details: folderErr?.message,
      });
    }

    // 3. Upload file to destinationFolderId
    const uploadUrl = `${apiDomain}/workdrive/api/v1/upload`;

    const formData = new FormData();
    const blob = new Blob([file.buffer], { type: file.mimetype });
    formData.append('content', blob, finalFileName);
    formData.append('parent_id', destinationFolderId);
    formData.append('filename', finalFileName);

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
      },
      body: formData,
    });

    const uploadResult = await safeJsonFetch(uploadRes);
    const uploadData = uploadResult.data;

    if (!uploadResult.ok || !uploadData || uploadData.error) {
      return res.status(400).json({
        success: false,
        error: uploadData?.error?.message || uploadData?.error || `Failed to upload file to Zoho WorkDrive (${uploadRes.status}).`,
        details: uploadData || uploadResult.text.slice(0, 300),
      });
    }

    const workspaceId = (rawWorkspaceId || '4imj816429a4baa7747aa814b03cdbe7b2c2c').trim();
    const zohoHost = domain || 'zoho.com';

    // 1. Build authentic direct folder URLs in Zoho WorkDrive private space
    const directFolderUrl = `https://workdrive.${zohoHost}/${workspaceId}/privatespace/folders/${destinationFolderId}`;
    const rootFolderUrl = `https://workdrive.${zohoHost}/${workspaceId}/privatespace/folders/${rootParentId}`;

    // 2. Extract file metadata
    const fileAttributes = uploadData.data?.[0]?.attributes;
    const fileId =
      fileAttributes?.resource_id ||
      fileAttributes?.['RESOURCE_ID'] ||
      uploadData.data?.[0]?.id ||
      uploadData.id ||
      '';

    const filePermalink =
      fileAttributes?.Permalink ||
      fileAttributes?.permalink ||
      (fileId ? `https://workdrive.${zohoHost}/file/${fileId}` : '');

    // 3. Generate direct document viewer link via Zoho WorkDrive Links API
    let documentUrl = '';

    if (fileId) {
      try {
        const linkRes = await fetch(`https://workdrive.${zohoHost}/workdrive/api/v1/links`, {
          method: 'POST',
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
            'Content-Type': 'application/vnd.api+json',
            Accept: 'application/vnd.api+json',
          },
          body: JSON.stringify({
            data: {
              attributes: {
                resource_id: fileId,
                link_name: `${finalFileName} Preview`,
                request_user_data: false,
                allow_download: true,
              },
              type: 'links',
            },
          }),
        });

        const linkResult = await safeJsonFetch(linkRes);
        if (linkResult.ok && linkResult.data) {
          // Zoho WorkDrive Links API returns the preview URL in `attributes.link`
          documentUrl =
            linkResult.data.data?.attributes?.link ||
            linkResult.data.data?.attributes?.link_url ||
            linkResult.data.data?.attributes?.url ||
            '';
        }
      } catch (linkErr) {
        console.warn('Could not generate external share link via Links API:', linkErr);
      }
    }

    // Direct document preview link:
    // If the universal share link was generated, use that so anyone can preview/open directly.
    // Otherwise use the authenticated Zoho file permalink.
    const finalDocumentUrl = documentUrl || filePermalink || directFolderUrl;

    return res.json({
      success: true,
      message: 'File successfully uploaded to Zoho WorkDrive!',
      fileId,
      fileName: finalFileName,
      permalink: finalDocumentUrl,     // Opens the document directly
      documentUrl: finalDocumentUrl,   // Explicit document URL
      folderUrl: directFolderUrl,     // Direct folder URL in Zoho WorkDrive
      rootFolderUrl,
      folderId: destinationFolderId,
      cycleFolder: targetCycleFolder,
      sizeBytes: file.size,
    });
  } catch (error: any) {
    console.error('Error during WorkDrive upload:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Error occurred while uploading to Zoho WorkDrive.',
    });
  }
});

// ============================================================================
// CLOUDINARY DELIVERABLE STORAGE CONFIGURATION & UPLOAD ENDPOINTS
// ============================================================================

interface ServerCloudinaryConfig {
  enabled?: boolean;
  cloudName?: string;
  apiKey?: string;
  apiSecret?: string;
  uploadPreset?: string;
  rootFolder?: string;
  autoCycleFolder?: boolean;
  namingConvention?: string;
  useDepartmentCode?: boolean;
  connected?: boolean;
  lastSyncedAt?: string;
}

const CLOUDINARY_CONFIG_FILE = path.join(process.cwd(), '.cloudinary-config.json');

function parseServerCloudinaryUrl(rawUrl?: string): { cloudName: string; apiKey: string; apiSecret: string } | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const cleaned = rawUrl.trim().replace(/^CLOUDINARY_URL=/i, '').replace(/^["']|["']$/g, '');
  if (!cleaned.toLowerCase().startsWith('cloudinary://')) return null;
  try {
    const withoutScheme = cleaned.slice('cloudinary://'.length);
    const atIndex = withoutScheme.lastIndexOf('@');
    if (atIndex === -1) return null;
    const creds = withoutScheme.slice(0, atIndex);
    const cloudName = withoutScheme.slice(atIndex + 1).split('/')[0].trim();
    const colonIndex = creds.indexOf(':');
    if (colonIndex === -1) return null;
    const apiKey = creds.slice(0, colonIndex).trim();
    const apiSecret = creds.slice(colonIndex + 1).trim();
    if (!cloudName || !apiKey || !apiSecret) return null;
    return { cloudName, apiKey, apiSecret };
  } catch {
    return null;
  }
}

function loadServerCloudinaryConfig(): ServerCloudinaryConfig {
  const envUrlParsed = parseServerCloudinaryUrl(process.env.CLOUDINARY_URL);
  const envCloudName = process.env.CLOUDINARY_CLOUD_NAME || envUrlParsed?.cloudName || '';
  const envApiKey = process.env.CLOUDINARY_API_KEY || envUrlParsed?.apiKey || '';
  const envApiSecret = process.env.CLOUDINARY_API_SECRET || envUrlParsed?.apiSecret || '';
  const envUploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || '';

  try {
    if (fs.existsSync(CLOUDINARY_CONFIG_FILE)) {
      const raw = fs.readFileSync(CLOUDINARY_CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        enabled: true,
        rootFolder: 'Deliverables',
        autoCycleFolder: true,
        namingConvention: 'department_username_[index]',
        useDepartmentCode: false,
        ...parsed,
        cloudName: parsed.cloudName || envCloudName || 'ho0rjsyi',
        apiKey: parsed.apiKey || envApiKey || '988431174297845',
        apiSecret: parsed.apiSecret || envApiSecret || 'yMLqH9UDbz9SJRPNTLTSgPlxwlg',
        uploadPreset: parsed.uploadPreset || envUploadPreset || 'ml_default',
        connected: true,
      };
    }
  } catch (e) {
    // Notice reading .cloudinary-config.json
  }

  const effectiveCloud = envCloudName || 'ho0rjsyi';
  const effectiveKey = envApiKey || '988431174297845';
  const effectiveSecret = envApiSecret || 'yMLqH9UDbz9SJRPNTLTSgPlxwlg';
  const effectivePreset = envUploadPreset || 'ml_default';

  return {
    enabled: true,
    cloudName: effectiveCloud,
    apiKey: effectiveKey,
    apiSecret: effectiveSecret,
    uploadPreset: effectivePreset,
    rootFolder: 'Deliverables',
    autoCycleFolder: true,
    namingConvention: 'department_username_[index]',
    useDepartmentCode: false,
    connected: true,
    lastSyncedAt: new Date().toISOString(),
  };
}

let serverCloudinaryConfig = loadServerCloudinaryConfig();

function saveServerCloudinaryConfig(updates: Partial<ServerCloudinaryConfig> & { cloudinaryUrl?: string }) {
  const parsedFromUrl =
    parseServerCloudinaryUrl(updates.cloudinaryUrl) ||
    parseServerCloudinaryUrl(updates.cloudName);

  const effectiveCloudName =
    parsedFromUrl?.cloudName ||
    (updates.cloudName && !updates.cloudName.startsWith('cloudinary://') && updates.cloudName.trim().length > 0
      ? updates.cloudName.trim()
      : serverCloudinaryConfig.cloudName || '');

  const effectiveApiKey =
    updates.apiKey === 'CLEARED'
      ? ''
      : parsedFromUrl?.apiKey ||
        (updates.apiKey && updates.apiKey.trim().length > 0
          ? updates.apiKey.trim()
          : serverCloudinaryConfig.apiKey || '');

  const effectiveApiSecret =
    updates.apiSecret === 'CLEARED'
      ? ''
      : parsedFromUrl?.apiSecret ||
        (updates.apiSecret && updates.apiSecret.trim().length > 0
          ? updates.apiSecret.trim()
          : serverCloudinaryConfig.apiSecret || '');

  const effectiveUploadPreset =
    updates.uploadPreset === 'CLEARED'
      ? ''
      : updates.uploadPreset !== undefined
      ? updates.uploadPreset.trim()
      : serverCloudinaryConfig.uploadPreset || '';

  const hasValidCreds = Boolean(
    effectiveCloudName && ((effectiveApiKey && effectiveApiSecret) || effectiveUploadPreset)
  );

  serverCloudinaryConfig = {
    ...serverCloudinaryConfig,
    ...updates,
    cloudName: effectiveCloudName,
    apiKey: effectiveApiKey,
    apiSecret: effectiveApiSecret,
    uploadPreset: effectiveUploadPreset,
    connected: updates.connected !== undefined ? updates.connected : hasValidCreds,
    lastSyncedAt: new Date().toISOString(),
  };

  try {
    fs.writeFileSync(CLOUDINARY_CONFIG_FILE, JSON.stringify(serverCloudinaryConfig, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing .cloudinary-config.json:', e);
  }
  return serverCloudinaryConfig;
}

/**
 * Get persistent server-side Cloudinary configuration
 */
app.get('/api/cloudinary/config', (_req: Request, res: Response) => {
  serverCloudinaryConfig = loadServerCloudinaryConfig();
  return res.json({
    success: true,
    config: serverCloudinaryConfig,
  });
});

/**
 * Save persistent server-side Cloudinary configuration
 */
app.post('/api/cloudinary/config', (req: Request, res: Response) => {
  try {
    const saved = saveServerCloudinaryConfig(req.body || {});
    return res.json({
      success: true,
      config: saved,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: err?.message || 'Failed to save Cloudinary configuration.',
    });
  }
});

/**
 * Test Cloudinary Connection & Credentials
 */
app.post('/api/cloudinary/test-connection', async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    serverCloudinaryConfig = loadServerCloudinaryConfig();

    const parsedUrl =
      parseServerCloudinaryUrl(body.cloudinaryUrl) ||
      parseServerCloudinaryUrl(body.cloudName);

    const activeCloudName = (
      parsedUrl?.cloudName ||
      (body.cloudName && !body.cloudName.startsWith('cloudinary://') ? body.cloudName.trim() : '') ||
      serverCloudinaryConfig.cloudName ||
      process.env.CLOUDINARY_CLOUD_NAME ||
      'ho0rjsyi'
    ).trim();

    const activeApiKey = (
      parsedUrl?.apiKey ||
      (body.apiKey && body.apiKey.trim()) ||
      serverCloudinaryConfig.apiKey ||
      process.env.CLOUDINARY_API_KEY ||
      '988431174297845'
    ).trim();

    const activeApiSecret = (
      parsedUrl?.apiSecret ||
      (body.apiSecret && body.apiSecret.trim()) ||
      serverCloudinaryConfig.apiSecret ||
      process.env.CLOUDINARY_API_SECRET ||
      'yMLqH9UDbz9SJRPNTLTSgPlxwlg'
    ).trim();

    const activeUploadPreset = (
      (body.uploadPreset && body.uploadPreset.trim()) ||
      serverCloudinaryConfig.uploadPreset ||
      process.env.CLOUDINARY_UPLOAD_PRESET ||
      ''
    ).trim();

    if (!activeCloudName) {
      return res.status(400).json({
        success: false,
        error: 'Missing Cloudinary Cloud Name. Please enter your Cloud Name or paste your CLOUDINARY_URL.',
      });
    }

    if (!activeApiKey && !activeUploadPreset) {
      return res.status(400).json({
        success: false,
        error: 'Missing credentials. Provide either API Key + API Secret (for Signed Uploads) or an Unsigned Upload Preset.',
      });
    }

    // If Signed credentials (API Key + API Secret) are provided, verify via Cloudinary Ping API
    if (activeApiKey && activeApiSecret) {
      const basicAuth = Buffer.from(`${activeApiKey}:${activeApiSecret}`).toString('base64');
      const pingRes = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(activeCloudName)}/ping`, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          Accept: 'application/json',
        },
      });

      const pingResult = await safeJsonFetch(pingRes);

      if (!pingResult.ok) {
        return res.status(400).json({
          success: false,
          error:
            pingResult.data?.error?.message ||
            `Cloudinary authentication failed (HTTP ${pingResult.status}). Please check your Cloud Name, API Key, and API Secret.`,
        });
      }

      saveServerCloudinaryConfig({
        cloudName: activeCloudName,
        apiKey: activeApiKey,
        apiSecret: activeApiSecret,
        uploadPreset: activeUploadPreset,
        connected: true,
      });

      return res.json({
        success: true,
        mode: 'signed',
        cloudName: activeCloudName,
        status: pingResult.data?.status || 'ok',
        message: `Cloudinary connected! Signed upload API verified for cloud "${activeCloudName}".`,
      });
    }

    // Unsigned Upload Preset mode verification
    if (activeUploadPreset) {
      saveServerCloudinaryConfig({
        cloudName: activeCloudName,
        uploadPreset: activeUploadPreset,
        connected: true,
      });

      return res.json({
        success: true,
        mode: 'unsigned',
        cloudName: activeCloudName,
        uploadPreset: activeUploadPreset,
        message: `Cloudinary configured in Unsigned Preset mode for cloud "${activeCloudName}" (Preset: "${activeUploadPreset}").`,
      });
    }

    return res.status(400).json({
      success: false,
      error: 'Please provide both API Key and API Secret, or an Unsigned Upload Preset.',
    });
  } catch (error: any) {
    console.error('Error testing Cloudinary connection:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Network error while testing Cloudinary connection.',
    });
  }
});

/**
 * Authenticated Deliverable Viewer & Downloader.
 * Resolves Cloudinary assets (especially PDFs and ZIPs) with an authenticated HMAC signature
 * to eliminate the "401 deny or ACL failure" error on restricted Cloudinary environments.
 */
app.get('/api/cloudinary/view-file', async (req: Request, res: Response) => {
  try {
    const rawUrl = (req.query.url as string || '').trim();
    const rawPublicId = (req.query.publicId as string || '').trim();
    const requestedFormat = (req.query.format as string || '').trim();
    const requestedResourceType = (req.query.resourceType as string || '').trim();
    const isDownload = req.query.download === 'true';

    // If not a Cloudinary asset, redirect directly to original URL
    if (rawUrl && !rawUrl.includes('cloudinary.com')) {
      return res.redirect(rawUrl);
    }

    serverCloudinaryConfig = loadServerCloudinaryConfig();
    const activeCloudName = (
      serverCloudinaryConfig.cloudName ||
      process.env.CLOUDINARY_CLOUD_NAME ||
      'ho0rjsyi'
    ).trim();

    const activeApiKey = (
      serverCloudinaryConfig.apiKey ||
      process.env.CLOUDINARY_API_KEY ||
      '988431174297845'
    ).trim();

    const activeApiSecret = (
      serverCloudinaryConfig.apiSecret ||
      process.env.CLOUDINARY_API_SECRET ||
      'yMLqH9UDbz9SJRPNTLTSgPlxwlg'
    ).trim();

    cleanCloudinaryEnv();

    const cloudinary = await getCloudinary();
    cloudinary.config({
      cloud_name: activeCloudName,
      api_key: activeApiKey,
      api_secret: activeApiSecret,
    });

    // Strip URL parameters before extracting public ID
    const cleanUrl = rawUrl.split('?')[0].split('#')[0];
    const isUrlRaw = cleanUrl.includes('/raw/');

    // Determine initial publicId and resourceType
    let extractedPublicId = '';
    let extractedResourceType = isUrlRaw ? 'raw' : (requestedResourceType || 'image');

    if (cleanUrl) {
      const match = cleanUrl.match(/res\.cloudinary\.com\/[^/]+\/(image|raw|video)\/upload\/(?:v\d+\/)?(.+?)$/);
      if (match) {
        extractedResourceType = match[1];
        extractedPublicId = decodeURIComponent(match[2]);
      }
    }

    const inputId = rawPublicId ? decodeURIComponent(rawPublicId) : extractedPublicId;

    if (!inputId && !cleanUrl) {
      return res.status(400).send('Missing file parameters.');
    }

    // Determine extension, base name, and full name
    const lastDot = inputId.lastIndexOf('.');
    const ext = requestedFormat || (lastDot !== -1 ? inputId.slice(lastDot + 1).toLowerCase() : (cleanUrl.endsWith('.pdf') ? 'pdf' : ''));
    const baseName = lastDot !== -1 ? inputId.slice(0, lastDot) : inputId;
    const fullNameWithExt = lastDot !== -1 ? inputId : (ext ? `${inputId}.${ext}` : inputId);

    // Candidates in order of likelihood
    const candidates: Array<{ publicId: string; format: string; resourceType: string }> = [];

    if (extractedResourceType === 'raw' || requestedResourceType === 'raw' || isUrlRaw) {
      candidates.push({ publicId: fullNameWithExt, format: '', resourceType: 'raw' });
      candidates.push({ publicId: baseName, format: ext || 'pdf', resourceType: 'image' });
      candidates.push({ publicId: baseName, format: '', resourceType: 'raw' });
    } else {
      candidates.push({ publicId: baseName, format: ext || 'pdf', resourceType: 'image' });
      candidates.push({ publicId: fullNameWithExt, format: '', resourceType: 'raw' });
      candidates.push({ publicId: fullNameWithExt, format: ext || 'pdf', resourceType: 'image' });
    }

    // Stream deliverable directly so user's browser renders it seamlessly
    for (const c of candidates) {
      try {
        const signedUrl = cloudinary.utils.private_download_url(c.publicId, c.format, {
          resource_type: c.resourceType,
          type: 'upload',
          attachment: isDownload,
        });

        const fetchRes = await fetch(signedUrl);
        if (fetchRes.ok) {
          const contentType =
            fetchRes.headers.get('content-type') ||
            (c.format.toLowerCase() === 'pdf' || c.publicId.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');
          const contentLength = fetchRes.headers.get('content-length');
          const customFileName =
            (req.query.fileName as string) ||
            `${c.publicId.split('/').pop()}${c.format && !c.publicId.endsWith('.' + c.format) ? '.' + c.format : ''}`;

          res.setHeader('Content-Type', contentType);
          res.setHeader(
            'Content-Disposition',
            `${isDownload ? 'attachment' : 'inline'}; filename="${encodeURIComponent(customFileName)}"`
          );
          if (contentLength) {
            res.setHeader('Content-Length', contentLength);
          }
          res.setHeader('Cache-Control', 'public, max-age=3600');

          const fileBuffer = Buffer.from(await fetchRes.arrayBuffer());
          return res.end(fileBuffer);
        }
      } catch (streamErr) {
        // Attempt next candidate
      }
    }

    // Fallback: If streaming could not complete, redirect to clean URL if available
    if (cleanUrl) {
      return res.redirect(cleanUrl);
    }

    return res.status(404).json({
      success: false,
      error: 'Deliverable file could not be found in Cloudinary.',
      publicId: inputId,
    });
  } catch (err: any) {
    console.error('Error generating signed Cloudinary view URL:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to generate deliverable view URL',
      stack: err?.stack,
    });
  }
});

/**
 * Generate a signed upload signature for direct browser-to-Cloudinary uploads.
 * This avoids buffering large files on the server and bypasses Cloud Run request body limits.
 */
app.post('/api/cloudinary/signature', (req: Request, res: Response) => {
  try {
    const { folder, publicId, cycleFolder, rootFolder } = req.body || {};
    serverCloudinaryConfig = loadServerCloudinaryConfig();

    const activeCloudName = (
      serverCloudinaryConfig.cloudName ||
      process.env.CLOUDINARY_CLOUD_NAME ||
      ''
    ).trim();

    const activeApiKey = (
      serverCloudinaryConfig.apiKey ||
      process.env.CLOUDINARY_API_KEY ||
      ''
    ).trim();

    const activeApiSecret = (
      serverCloudinaryConfig.apiSecret ||
      process.env.CLOUDINARY_API_SECRET ||
      ''
    ).trim();

    const activeUploadPreset = (
      serverCloudinaryConfig.uploadPreset ||
      process.env.CLOUDINARY_UPLOAD_PRESET ||
      ''
    ).trim();

    if (!activeCloudName) {
      return res.status(400).json({
        success: false,
        error: 'Cloudinary Cloud Name is not configured.',
      });
    }

    const cleanRootFolder = (rootFolder || serverCloudinaryConfig.rootFolder || 'Deliverables').trim().replace(/^\/+|\/+$/g, '');
    const targetCycleFolder = (cycleFolder || 'Cycle-Current').trim().replace(/^\/+|\/+$/g, '');
    const folderPath = folder || `${cleanRootFolder}/${targetCycleFolder}`;

    const timestamp = Math.floor(Date.now() / 1000);
    const overwrite = 'true';

    let signature = '';
    if (activeApiKey && activeApiSecret) {
      // Parameters must be sorted alphabetically by name: folder, overwrite, public_id (if present), timestamp
      const paramsToSign: string[] = [];
      if (folderPath) paramsToSign.push(`folder=${folderPath}`);
      paramsToSign.push(`overwrite=${overwrite}`);
      if (publicId) paramsToSign.push(`public_id=${publicId}`);
      paramsToSign.push(`timestamp=${timestamp}`);

      const stringToSign = paramsToSign.join('&') + activeApiSecret;
      signature = crypto.createHash('sha1').update(stringToSign).digest('hex');
    }

    return res.json({
      success: true,
      cloudName: activeCloudName,
      apiKey: activeApiKey,
      uploadPreset: activeUploadPreset,
      folder: folderPath,
      publicId: publicId || undefined,
      timestamp,
      overwrite,
      signature: signature || undefined,
      uploadUrl: `https://api.cloudinary.com/v1_1/${encodeURIComponent(activeCloudName)}/auto/upload`,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error?.message || 'Failed to generate Cloudinary signature.',
    });
  }
});

/**
 * Upload Deliverable File directly to Cloudinary
 * Supports both Signed Uploads (API Key + API Secret) and Unsigned Uploads (Upload Preset)
 */
app.post('/api/cloudinary/upload', (req: Request, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message || 'File upload middleware error (max 100MB).',
      });
    }
    next();
  });
}, async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, error: 'No file provided for upload.' });
    }

    const {
      cloudName,
      apiKey,
      apiSecret,
      uploadPreset,
      cloudinaryUrl,
      rootFolder,
      cycleFolder,
      formattedFileName,
    } = req.body;

    serverCloudinaryConfig = loadServerCloudinaryConfig();

    const parsedUrl =
      parseServerCloudinaryUrl(cloudinaryUrl) ||
      parseServerCloudinaryUrl(cloudName);

    const activeCloudName = (
      parsedUrl?.cloudName ||
      (cloudName && !cloudName.startsWith('cloudinary://') ? cloudName.trim() : '') ||
      serverCloudinaryConfig.cloudName ||
      process.env.CLOUDINARY_CLOUD_NAME ||
      ''
    ).trim();

    const activeApiKey = (
      parsedUrl?.apiKey ||
      (apiKey && apiKey.trim()) ||
      serverCloudinaryConfig.apiKey ||
      process.env.CLOUDINARY_API_KEY ||
      ''
    ).trim();

    const activeApiSecret = (
      parsedUrl?.apiSecret ||
      (apiSecret && apiSecret.trim()) ||
      serverCloudinaryConfig.apiSecret ||
      process.env.CLOUDINARY_API_SECRET ||
      ''
    ).trim();

    const activeUploadPreset = (
      (uploadPreset && uploadPreset.trim()) ||
      serverCloudinaryConfig.uploadPreset ||
      process.env.CLOUDINARY_UPLOAD_PRESET ||
      ''
    ).trim();

    if (!activeCloudName || ((!activeApiKey || !activeApiSecret) && !activeUploadPreset)) {
      return res.status(400).json({
        success: false,
        error:
          'Cloudinary credentials are not configured yet. Please go to Admin Console → Cloudinary Storage to enter your Cloud Name and API Key / Secret (or Upload Preset).',
      });
    }

    // Persist valid credentials
    saveServerCloudinaryConfig({
      cloudName: activeCloudName,
      apiKey: activeApiKey,
      apiSecret: activeApiSecret,
      uploadPreset: activeUploadPreset,
      connected: true,
    });

    const cleanRootFolder = (rootFolder || serverCloudinaryConfig.rootFolder || 'Deliverables').trim().replace(/^\/+|\/+$/g, '');
    const targetCycleFolder = (cycleFolder || 'Cycle-Current').trim().replace(/^\/+|\/+$/g, '');
    const folderPath = `${cleanRootFolder}/${targetCycleFolder}`;
    const finalFileName = (formattedFileName || file.originalname || 'deliverable.pdf').trim();

    // Determine extension and public_id
    const lastDotIdx = finalFileName.lastIndexOf('.');
    const ext = lastDotIdx !== -1 ? finalFileName.slice(lastDotIdx + 1).toLowerCase() : '';
    const baseNameWithoutExt = lastDotIdx !== -1 ? finalFileName.slice(0, lastDotIdx) : finalFileName;

    // For standard image/video/pdf types, Cloudinary's /auto/upload appends the extension automatically to secure_url.
    // For raw document types (docx, xlsx, pptx, zip, txt, csv, srt, etc.), public_id must retain the extension.
    const autoExtensionTypes = [
      'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'avif',
      'pdf',
      'mp4', 'mov', 'webm', 'avi', 'mkv', 'mp3', 'wav', 'ogg',
    ];
    const publicId = autoExtensionTypes.includes(ext) ? baseNameWithoutExt : finalFileName;

    const uploadEndpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(activeCloudName)}/auto/upload`;
    const formData = new FormData();
    const fileBlob = new Blob([file.buffer], { type: file.mimetype || 'application/octet-stream' });
    formData.append('file', fileBlob, finalFileName);
    formData.append('folder', folderPath);
    formData.append('public_id', publicId);

    if (activeApiKey && activeApiSecret) {
      // Signed Upload
      const timestamp = Math.floor(Date.now() / 1000);
      const overwrite = 'true';
      formData.append('overwrite', overwrite);
      formData.append('timestamp', String(timestamp));
      formData.append('api_key', activeApiKey);

      // Alphabetical parameter string for signature: folder, overwrite, public_id, timestamp
      const stringToSign = `folder=${folderPath}&overwrite=${overwrite}&public_id=${publicId}&timestamp=${timestamp}${activeApiSecret}`;
      const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');
      formData.append('signature', signature);
    } else if (activeUploadPreset) {
      // Unsigned Upload
      formData.append('upload_preset', activeUploadPreset);
    }

    const uploadRes = await fetch(uploadEndpoint, {
      method: 'POST',
      body: formData,
    });

    const uploadResult = await safeJsonFetch(uploadRes);
    const uploadData = uploadResult.data;

    if (!uploadResult.ok || !uploadData || uploadData.error || !uploadData.secure_url) {
      console.error('Cloudinary upload error:', uploadResult.text);
      return res.status(uploadResult.status || 400).json({
        success: false,
        error:
          uploadData?.error?.message ||
          `Cloudinary upload failed (HTTP ${uploadResult.status}). Please verify your Cloudinary credentials.`,
        details: uploadResult.text.slice(0, 300),
      });
    }

    const secureUrl: string = uploadData.secure_url;

    return res.json({
      success: true,
      message: 'Deliverable successfully uploaded to Cloudinary!',
      provider: 'cloudinary',
      fileId: uploadData.asset_id || uploadData.public_id,
      publicId: uploadData.public_id,
      fileName: finalFileName,
      secureUrl,
      permalink: secureUrl,
      documentUrl: secureUrl,
      resourceType: uploadData.resource_type,
      format: uploadData.format || ext,
      cycleFolder: targetCycleFolder,
      folderPath,
      sizeBytes: uploadData.bytes || file.size,
    });
  } catch (error: any) {
    console.error('Error during Cloudinary upload:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'An error occurred while uploading to Cloudinary.',
    });
  }
});

// Explicit robots.txt route blocking all web scrapers and crawlers
app.get('/robots.txt', (_req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nDisallow: /\n');
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', server: 'Snazzy Operations API' });
});

// Global JSON error handler middleware - ensures all unhandled errors return JSON and never HTML
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  if (res.headersSent) {
    return _next(err);
  }
  return res.status(400).json({
    success: false,
    error: err.message || 'An unexpected error occurred.',
  });
});

// Dedicated API 404 guard: any request to /api/* that reached this point was not matched
// and MUST return JSON 404, NEVER fall through to Vite SPA middleware to return index.html
app.all('/api/*', (req: Request, res: Response) => {
  return res.status(404).json({
    success: false,
    error: `API endpoint not found: ${req.method} ${req.path}`,
  });
});

// Setup Vite development middleware or static production serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

// In local and Cloud Run environments, start the Express server.
// In Vercel serverless environments, Vercel imports and wraps `app`.
if (!process.env.VERCEL) {
  startServer();
}

export default app;
