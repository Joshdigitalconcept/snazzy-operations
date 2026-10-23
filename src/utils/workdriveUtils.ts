/**
 * Zoho WorkDrive Deliverables Utility
 * 
 * Implements the organizational specification:
 * Root: Deliverables folder
 * Subfolder: For each cycle folder (e.g., Cycle-2026-09-W2)
 * File Name: department_username_[index] (e.g. SoftwareEngineering_joshuafasinuro_[1].pdf)
 */

export interface WorkDriveNamingParams {
  departmentName: string;
  departmentCode?: string;
  userName: string;
  userEmail?: string;
  index: number;
  originalFileName?: string;
  extension?: string;
  useDepartmentCode?: boolean; // toggle whether to use "SE" or "SoftwareEngineering"
}

export function sanitizeDepartmentSlug(name: string, code?: string, useCode = false): string {
  if (name && name.trim().toLowerCase() === 'community') {
    return 'Community';
  }
  if (useCode && code && code.trim().length > 0) {
    return code.trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  }
  if (!name) return 'Department';
  // Remove special characters and spaces, keeping PascalCase or Alphanumeric
  const cleaned = name
    .replace(/[^\w\s]/gi, '')
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
  return cleaned || 'General';
}

export function sanitizeUsernameSlug(name: string, email?: string): string {
  if (email && email.includes('@')) {
    const emailPrefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '');
    if (emailPrefix.length >= 2) return emailPrefix;
  }
  if (!name) return 'user';
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, '_');
}

export function getWorkDriveCycleFolderName(weekId: string): string {
  if (!weekId) return 'Cycle-Current';
  const cleanWeek = weekId.trim();
  if (cleanWeek.toLowerCase().startsWith('cycle')) {
    return cleanWeek;
  }
  return `Cycle-${cleanWeek}`;
}

export function getFileExtension(filename: string): string {
  if (!filename || !filename.includes('.')) return '';
  const parts = filename.split('.');
  const ext = parts[parts.length - 1];
  return ext ? `.${ext.toLowerCase()}` : '';
}

/**
 * Builds the exact Zoho WorkDrive deliverable filename:
 * format: department_username_[index]
 * example: SoftwareEngineering_joshuafasinuro_[1].pdf
 */
export function buildWorkDriveFileName(params: WorkDriveNamingParams): string {
  const dept = sanitizeDepartmentSlug(params.departmentName, params.departmentCode, params.useDepartmentCode);
  const user = sanitizeUsernameSlug(params.userName, params.userEmail);
  const ext = params.extension || (params.originalFileName ? getFileExtension(params.originalFileName) : '');
  
  // Format: department_username_[index]
  return `${dept}_${user}_[${params.index}]${ext}`;
}

/**
 * Generates the full hierarchical path in Zoho WorkDrive:
 * Deliverables / Cycle-Folder / department_username_[index].ext
 */
export function buildWorkDriveFullPath(
  cycleFolder: string,
  fileName: string,
  rootFolder = 'Deliverables'
): string {
  return `${rootFolder}/${cycleFolder}/${fileName}`;
}

/**
 * Parses either a raw folder ID or a full Zoho WorkDrive URL to extract workspace ID and folder ID.
 * Example input: "https://workdrive.zoho.com/4imj816429a4baa7747aa814b03cdbe7b2c2c/privatespace/folders/6p1w1d9fdf7f349244201bd98bea82e968be5"
 */
export function parseWorkDriveFolderInput(input: string): { folderId: string; workspaceId: string } {
  const trimmed = (input || '').trim();
  const defaultFolderId = '6p1w1d9fdf7f349244201bd98bea82e968be5';
  const defaultWorkspaceId = '4imj816429a4baa7747aa814b03cdbe7b2c2c';

  if (!trimmed) {
    return { folderId: defaultFolderId, workspaceId: defaultWorkspaceId };
  }

  // Check if it's a full URL
  if (trimmed.includes('workdrive.zoho.')) {
    try {
      const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      const segments = url.pathname.split('/').filter(Boolean);
      // Format usually: [workspaceId, "privatespace", "folders", folderId]
      if (segments.length >= 4 && segments[2] === 'folders') {
        return {
          workspaceId: segments[0] || defaultWorkspaceId,
          folderId: segments[3] || defaultFolderId,
        };
      }
      // If ends with a folder ID
      const lastSeg = segments[segments.length - 1];
      if (lastSeg && lastSeg.length >= 15) {
        return {
          workspaceId: segments[0] && segments[0] !== 'home' ? segments[0] : defaultWorkspaceId,
          folderId: lastSeg,
        };
      }
    } catch {
      // ignore parse error
    }
  }

  // Otherwise assume it's just the folder ID
  return {
    folderId: trimmed.replace(/[^a-zA-Z0-9]/g, '') || defaultFolderId,
    workspaceId: defaultWorkspaceId,
  };
}

/**
 * Generates a direct Zoho WorkDrive web URL for opening the folder
 */
export function buildWorkDrivePreviewUrl(
  folderPath: string,
  fileName: string,
  zohoDomain = 'zoho.com',
  parentFolderId = '6p1w1d9fdf7f349244201bd98bea82e968be5',
  workspaceId = '4imj816429a4baa7747aa814b03cdbe7b2c2c'
): string {
  const cleanFolderId = (parentFolderId || '6p1w1d9fdf7f349244201bd98bea82e968be5').trim();
  const cleanWorkspace = (workspaceId || '4imj816429a4baa7747aa814b03cdbe7b2c2c').trim();
  return `https://workdrive.${zohoDomain}/${cleanWorkspace}/privatespace/folders/${cleanFolderId}`;
}

/**
 * Parses a CLOUDINARY_URL string (e.g. "cloudinary://123456:abcdef@my_cloud_name" or "CLOUDINARY_URL=cloudinary://...")
 * into { cloudName, apiKey, apiSecret }
 */
export function parseCloudinaryUrlInput(input: string): {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
} | null {
  const cleaned = (input || '').trim().replace(/^CLOUDINARY_URL=/i, '').replace(/^["']|["']$/g, '');
  if (!cleaned.toLowerCase().startsWith('cloudinary://')) {
    return null;
  }
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

export const parseCloudinaryUrl = parseCloudinaryUrlInput;

/**
 * Resolves any deliverable URL to ensure it points to the authenticated viewer endpoint
 * for Cloudinary assets (bypassing the "401 deny or ACL failure" on PDFs and restricted files)
 * or to external document URLs.
 */
export function resolveWorkDriveOpenUrl(
  rawUrl?: string,
  publicId?: string,
  fileName?: string,
  _parentFolderId = '',
  _workspaceId = '',
  _zohoDomain = 'zoho.com'
): string {
  if (!rawUrl || !rawUrl.trim()) {
    return '';
  }

  const url = rawUrl.trim();

  // If already routed to our view-file endpoint, return as-is
  if (url.startsWith('/api/cloudinary/view-file') || url.includes('/api/cloudinary/view-file')) {
    return url;
  }

  // If it's a Cloudinary asset URL, route through authenticated view-file proxy
  // to avoid "401 deny or ACL failure" on PDFs and restricted deliverable files
  if (url.includes('cloudinary.com')) {
    const params = new URLSearchParams();
    params.set('url', url);
    if (publicId && publicId.trim()) {
      params.set('publicId', publicId.trim());
    }
    if (fileName && fileName.trim()) {
      params.set('fileName', fileName.trim());
    }
    return `/api/cloudinary/view-file?${params.toString()}`;
  }

  // If it's any other valid web link (Google Drive, Dropbox, GitHub, Figma, etc.), return as-is
  return url;
}

