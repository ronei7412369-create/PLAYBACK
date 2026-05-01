export class StorageEngine {
  private dbName = 'PrimeMultitrackDB';
  private dbVersion = 2;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('songs')) {
          db.createObjectStore('songs', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('stems')) {
          db.createObjectStore('stems', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('setlists')) {
          db.createObjectStore('setlists', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        resolve();
      };

      request.onerror = (event: any) => {
        console.error('IndexedDB error:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async saveSong(song: any, stemsData: { id: string, buffer: ArrayBuffer }[]): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['songs', 'stems'], 'readwrite');
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = (err) => reject(err);

      const songStore = transaction.objectStore('songs');
      songStore.put(song);

      const stemStore = transaction.objectStore('stems');
      stemsData.forEach(stem => {
        stemStore.put(stem);
      });
    });
  }

  async loadSongs(): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['songs'], 'readonly');
      const store = transaction.objectStore('songs');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (err) => reject(err);
    });
  }

  async loadStemBuffer(id: string): Promise<ArrayBuffer | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['stems'], 'readonly');
      const store = transaction.objectStore('stems');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result ? request.result.buffer : null);
      request.onerror = (err) => reject(err);
    });
  }

  async savePadBuffer(note: string, buffer: ArrayBuffer): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['stems'], 'readwrite');
      transaction.oncomplete = () => resolve();
      transaction.onerror = (err) => reject(err);
      transaction.objectStore('stems').put({ id: `pad-${note}`, buffer });
    });
  }

  async loadPadBuffer(note: string): Promise<ArrayBuffer | null> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['stems'], 'readonly');
      const request = transaction.objectStore('stems').get(`pad-${note}`);
      request.onsuccess = () => resolve(request.result ? request.result.buffer : null);
      request.onerror = (err) => reject(err);
    });
  }

  async getCustomPadNotes(): Promise<string[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['stems'], 'readonly');
      const request = transaction.objectStore('stems').getAllKeys();
      request.onsuccess = () => {
         const keys = request.result as string[];
         resolve(keys.filter(k => k.startsWith('pad-')).map(k => k.replace('pad-', '')));
      };
      request.onerror = (err) => reject(err);
    });
  }

  async loadSetlists(): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['setlists'], 'readonly');
      const store = transaction.objectStore('setlists');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = (err) => reject(err);
    });
  }

  async saveSetlist(setlist: { id: string, name: string, songIds: string[] }): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['setlists'], 'readwrite');
      transaction.oncomplete = () => resolve();
      transaction.onerror = (err) => reject(err);
      transaction.objectStore('setlists').put(setlist);
    });
  }

  async deleteSetlist(id: string): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['setlists'], 'readwrite');
      transaction.oncomplete = () => resolve();
      transaction.onerror = (err) => reject(err);
      transaction.objectStore('setlists').delete(id);
    });
  }

  async clearAll(): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['songs', 'stems'], 'readwrite');
      transaction.objectStore('songs').clear();
      transaction.objectStore('stems').clear();
      transaction.oncomplete = () => resolve();
      transaction.onerror = (err) => reject(err);
    });
  }
}

export const storageEngine = new StorageEngine();
