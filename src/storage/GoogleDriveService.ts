const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";
const GIS_SCRIPT = "https://accounts.google.com/gsi/client";

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
}

interface GoogleTokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface GoogleTokenClient {
  requestAccessToken(options?: { prompt?: string }): void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (response: GoogleTokenResponse) => void;
            error_callback?: (error: { type?: string; message?: string }) => void;
          }): GoogleTokenClient;
          revoke(token: string, callback?: () => void): void;
        };
      };
    };
  }
}

let gisScriptPromise: Promise<void> | null = null;

function loadScript(src: string, id: string): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisScriptPromise) return gisScriptPromise;

  gisScriptPromise = new Promise((resolve, reject) => {
    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = id;
      script.src = src;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    let elapsed = 0;
    const interval = window.setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        window.clearInterval(interval);
        resolve();
        return;
      }

      elapsed += 25;
      if (elapsed >= 10000) {
        window.clearInterval(interval);
        gisScriptPromise = null;
        reject(new Error("Google-aanmelding kon niet worden geladen."));
      }
    }, 25);

    script.onerror = () => {
      window.clearInterval(interval);
      gisScriptPromise = null;
      reject(new Error("Google-aanmelding kon niet worden geladen."));
    };
  });

  return gisScriptPromise;
}

function driveError(status: number, payload: any): Error {
  const message =
    payload?.error?.message ||
    payload?.error_description ||
    `Google Drive gaf foutcode ${status}.`;
  return new Error(message);
}

class GoogleDriveService {
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;
  private currentFile: GoogleDriveFile | null = null;
  private boundStructure: object | null = null;

  isConfigured(): boolean {
    return Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim());
  }

  getCurrentFile(): GoogleDriveFile | null {
    return this.boundStructure === globalThis.structure
      ? this.currentFile
      : null;
  }

  setCurrentFile(file: GoogleDriveFile): void {
    this.currentFile = file;
    this.boundStructure = globalThis.structure;
  }

  clearCurrentFile(): void {
    this.currentFile = null;
    this.boundStructure = null;
  }

  rebindToCurrentStructure(): void {
    if (this.currentFile) {
      this.boundStructure = globalThis.structure;
    }
  }

  private async requestAccessToken(forceConsent = false): Promise<string> {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
    if (!clientId) {
      throw new Error(
        "Google Drive is niet geconfigureerd. Stel VITE_GOOGLE_CLIENT_ID in."
      );
    }

    if (
      !forceConsent &&
      this.accessToken &&
      Date.now() < this.tokenExpiresAt - 60_000
    ) {
      return this.accessToken;
    }

    await loadScript(GIS_SCRIPT, "google-identity-services");

    return new Promise((resolve, reject) => {
      const oauth2 = window.google?.accounts?.oauth2;
      if (!oauth2) {
        reject(new Error("Google-aanmelding is niet beschikbaar."));
        return;
      }

      const tokenClient = oauth2.initTokenClient({
        client_id: clientId,
        scope: DRIVE_SCOPE,
        callback: (response) => {
          if (response.error || !response.access_token) {
            reject(
              new Error(
                response.error_description ||
                  response.error ||
                  "Google-aanmelding werd geannuleerd."
              )
            );
            return;
          }

          this.accessToken = response.access_token;
          this.tokenExpiresAt =
            Date.now() + (response.expires_in || 3600) * 1000;
          resolve(response.access_token);
        },
        error_callback: (error) => {
          reject(
            new Error(
              error.message ||
                (error.type === "popup_closed"
                  ? "Google-aanmelding werd geannuleerd."
                  : "Google-aanmelding is mislukt.")
            )
          );
        },
      });

      tokenClient.requestAccessToken({
        prompt: forceConsent || !this.accessToken ? "consent" : "",
      });
    });
  }

  private async fetchDrive(
    url: string,
    init: RequestInit = {},
    retryAfterUnauthorized = true
  ): Promise<Response> {
    const token = await this.requestAccessToken();
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);

    const response = await fetch(url, { ...init, headers });
    if (response.status === 401 && retryAfterUnauthorized) {
      this.accessToken = null;
      this.tokenExpiresAt = 0;
      return this.fetchDrive(url, init, false);
    }
    return response;
  }

  async listFiles(): Promise<GoogleDriveFile[]> {
    const files: GoogleDriveFile[] = [];
    let pageToken = "";

    do {
      const params = new URLSearchParams({
        q: "trashed = false and (name contains '.eds' or name contains '.json')",
        spaces: "drive",
        orderBy: "modifiedTime desc",
        pageSize: "100",
        fields: "nextPageToken,files(id,name,mimeType,modifiedTime,size)",
      });
      if (pageToken) params.set("pageToken", pageToken);

      const response = await this.fetchDrive(`${DRIVE_API}/files?${params}`);
      const payload = await response.json();
      if (!response.ok) throw driveError(response.status, payload);

      files.push(...(payload.files || []));
      pageToken = payload.nextPageToken || "";
    } while (pageToken);

    return files;
  }

  async downloadFile(file: GoogleDriveFile): Promise<string> {
    const response = await this.fetchDrive(
      `${DRIVE_API}/files/${encodeURIComponent(file.id)}?alt=media`
    );
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw driveError(response.status, payload);
    }

    return response.text();
  }

  async saveFile(
    content: string,
    name: string,
    mimeType: string,
    saveAs = false
  ): Promise<GoogleDriveFile> {
    const existingId = saveAs ? null : this.currentFile?.id;
    const boundary = `eendraadschema_${crypto.randomUUID()}`;
    const metadata = JSON.stringify({ name, mimeType });
    const body = new Blob(
      [
        `--${boundary}\r\n`,
        "Content-Type: application/json; charset=UTF-8\r\n\r\n",
        metadata,
        `\r\n--${boundary}\r\n`,
        `Content-Type: ${mimeType}\r\n\r\n`,
        content,
        `\r\n--${boundary}--`,
      ],
      { type: `multipart/related; boundary=${boundary}` }
    );

    const url = existingId
      ? `${DRIVE_UPLOAD_API}/files/${encodeURIComponent(existingId)}?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size`
      : `${DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size`;
    const response = await this.fetchDrive(url, {
      method: existingId ? "PATCH" : "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    });
    const payload = await response.json();
    if (!response.ok) throw driveError(response.status, payload);

    this.currentFile = payload as GoogleDriveFile;
    this.boundStructure = globalThis.structure;
    return this.currentFile;
  }

  signOut(): void {
    if (this.accessToken && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(this.accessToken);
    }
    this.accessToken = null;
    this.tokenExpiresAt = 0;
    this.currentFile = null;
    this.boundStructure = null;
  }
}

export const googleDriveService = new GoogleDriveService();
