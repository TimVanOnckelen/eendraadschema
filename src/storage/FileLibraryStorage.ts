/**
 * @class FileLibraryStorage
 * @description
 * Manages a library of EDS files stored in IndexedDB.
 * Each file is stored with metadata including filename, timestamp, and content.
 */

export interface EdsFileMetadata {
  id: string; // Unique ID for the file
  filename: string;
  content: string; // The actual EDS file content
  timestamp: number; // Unix timestamp
  dateModified: string; // Formatted date string
  size: number; // File size in bytes
  isAutoSave?: boolean; // Whether this is an autosave
}

export class FileLibraryStorage {
  private dbName: string = "DB_EDS_LIBRARY";
  private storeName: string = "files";
  private db: IDBDatabase | null = null;

  /**
   * Open or create the file library database
   */
  private async openDB(): Promise<IDBDatabase | null> {
    if (this.db) return this.db;

    return new Promise((resolve) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: "id" });
          // Create indexes for efficient querying
          store.createIndex("filename", "filename", { unique: false });
          store.createIndex("timestamp", "timestamp", { unique: false });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onerror = () => {
        console.error("Error opening file library database");
        resolve(null);
      };
    });
  }

  /**
   * Generate a unique ID for a file
   */
  private generateId(): string {
    return `eds_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Save a file to the library
   */
  async saveFile(
    filename: string,
    content: string,
    isAutoSave: boolean = false
  ): Promise<string | null> {
    try {
      const db = await this.openDB();
      if (!db) return null;

      const id = this.generateId();
      const timestamp = Date.now();
      const dateModified = new Date(timestamp).toLocaleString("nl-BE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const fileData: EdsFileMetadata = {
        id,
        filename,
        content,
        timestamp,
        dateModified,
        size: new Blob([content]).size,
        isAutoSave,
      };

      return new Promise((resolve) => {
        const transaction = db.transaction(this.storeName, "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.add(fileData);

        request.onsuccess = () => resolve(id);
        request.onerror = () => {
          console.error("Error saving file to library");
          resolve(null);
        };
      });
    } catch (error) {
      console.error("Error in saveFile:", error);
      return null;
    }
  }

  /**
   * Update an existing file
   */
  async updateFile(
    id: string,
    filename: string,
    content: string
  ): Promise<boolean> {
    try {
      const db = await this.openDB();
      if (!db) return false;

      const timestamp = Date.now();
      const dateModified = new Date(timestamp).toLocaleString("nl-BE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const fileData: EdsFileMetadata = {
        id,
        filename,
        content,
        timestamp,
        dateModified,
        size: new Blob([content]).size,
        isAutoSave: false,
      };

      return new Promise((resolve) => {
        const transaction = db.transaction(this.storeName, "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.put(fileData);

        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      });
    } catch (error) {
      console.error("Error updating file:", error);
      return false;
    }
  }

  /**
   * Get a specific file by ID
   */
  async getFile(id: string): Promise<EdsFileMetadata | null> {
    try {
      const db = await this.openDB();
      if (!db) return null;

      return new Promise((resolve) => {
        const transaction = db.transaction(this.storeName, "readonly");
        const store = transaction.objectStore(this.storeName);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => resolve(null);
      });
    } catch (error) {
      console.error("Error getting file:", error);
      return null;
    }
  }

  /**
   * List all files in the library
   */
  async listFiles(): Promise<EdsFileMetadata[]> {
    try {
      const db = await this.openDB();
      if (!db) return [];

      return new Promise((resolve) => {
        const transaction = db.transaction(this.storeName, "readonly");
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          const files = request.result || [];
          // Sort by timestamp, newest first
          files.sort((a, b) => b.timestamp - a.timestamp);
          resolve(files);
        };

        request.onerror = () => {
          console.error("Error listing files");
          resolve([]);
        };
      });
    } catch (error) {
      console.error("Error in listFiles:", error);
      return [];
    }
  }

  /**
   * Delete a file from the library
   */
  async deleteFile(id: string): Promise<boolean> {
    try {
      const db = await this.openDB();
      if (!db) return false;

      return new Promise((resolve) => {
        const transaction = db.transaction(this.storeName, "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(id);

        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      return false;
    }
  }

  /**
   * Clear all files from the library
   */
  async clearAll(): Promise<boolean> {
    try {
      const db = await this.openDB();
      if (!db) return false;

      return new Promise((resolve) => {
        const transaction = db.transaction(this.storeName, "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      });
    } catch (error) {
      console.error("Error clearing library:", error);
      return false;
    }
  }

  /**
   * Search files by filename
   */
  async searchFiles(query: string): Promise<EdsFileMetadata[]> {
    const allFiles = await this.listFiles();
    const lowerQuery = query.toLowerCase();
    return allFiles.filter((file) =>
      file.filename.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Duplicate a file (create a copy)
   */
  async duplicateFile(id: string): Promise<string | null> {
    try {
      const originalFile = await this.getFile(id);
      if (!originalFile) return null;

      // Generate new filename with " (kopie)" suffix
      let newFilename = originalFile.filename.replace(/\.eds$/, " (kopie).eds");

      // If already has (kopie), add a number
      const copyMatch = newFilename.match(/\(kopie( \d+)?\)\.eds$/);
      if (copyMatch) {
        const num = copyMatch[1] ? parseInt(copyMatch[1].trim()) + 1 : 2;
        newFilename = originalFile.filename.replace(
          /\(kopie( \d+)?\)\.eds$/,
          `(kopie ${num}).eds`
        );
      }

      return await this.saveFile(newFilename, originalFile.content, false);
    } catch (error) {
      console.error("Error duplicating file:", error);
      return null;
    }
  }

  /**
   * Rename a file
   */
  async renameFile(id: string, newFilename: string): Promise<boolean> {
    try {
      const file = await this.getFile(id);
      if (!file) return false;

      // Ensure .eds extension
      if (!newFilename.endsWith(".eds")) {
        newFilename += ".eds";
      }

      return await this.updateFile(id, newFilename, file.content);
    } catch (error) {
      console.error("Error renaming file:", error);
      return false;
    }
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
