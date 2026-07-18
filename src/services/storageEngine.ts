import { db, storage, auth } from './firebase';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getBytes, deleteObject } from 'firebase/storage';

function removeUndefinedFields(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedFields(item));
  }
  if (typeof obj === 'object') {
    if (Object.prototype.toString.call(obj) === '[object Object]') {
      const res: any = {};
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (val !== undefined) {
          res[key] = removeUndefinedFields(val);
        }
      }
      return res;
    }
  }
  return obj;
}

export class StorageEngine {
  private dbBaseName = 'PrimeMultitrackDB';
  private dbVersion = 2;
  private db: IDBDatabase | null = null;
  private currentDbName = 'PrimeMultitrackDB';
  private syncing = false;

  async init(userId?: string): Promise<void> {
    const activeUserId = userId || auth.currentUser?.uid;
    const targetDbName = activeUserId ? `${this.dbBaseName}_${activeUserId}` : this.dbBaseName;

    if (this.db) {
      if (this.currentDbName === targetDbName) {
        return;
      }
      try {
        this.db.close();
      } catch (e) {
        console.error('Error closing IndexedDB:', e);
      }
      this.db = null;
    }

    this.currentDbName = targetDbName;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(targetDbName, this.dbVersion);

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

  async syncFromCloud(): Promise<void> {
    if (!this.db) await this.init();
    if (!auth.currentUser || this.syncing) return;
    this.syncing = true;
    
    try {
      const userId = auth.currentUser.uid;
      
      // Sync Songs
      const songsSnapshot = await getDocs(collection(db, 'users', userId, 'songs'));
      const songs = songsSnapshot.docs.map(doc => doc.data());
      
      // Sync Setlists
      const setlistsSnapshot = await getDocs(collection(db, 'users', userId, 'setlists'));
      const setlists = setlistsSnapshot.docs.map(doc => doc.data());

      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction(['songs', 'setlists'], 'readwrite');
        transaction.oncomplete = () => resolve();
        transaction.onerror = (err) => reject(err);
        
        const songStore = transaction.objectStore('songs');
        songs.forEach(song => songStore.put(song));
        
        const setlistStore = transaction.objectStore('setlists');
        setlists.forEach(setlist => setlistStore.put(setlist));
      });
    } catch (err) {
      console.error("Error syncing from cloud:", err);
    } finally {
      this.syncing = false;
    }
  }

  sanitizeSong(song: any): any {
    if (!song) return song;
    const sanitized = { ...song };
    if (Array.isArray(sanitized.stems)) {
      sanitized.stems = sanitized.stems.map((stem: any) => {
        const { buffer, originalFile, ...rest } = stem;
        return rest;
      });
    }
    if (sanitized.waveformPeaks && !Array.isArray(sanitized.waveformPeaks)) {
      sanitized.waveformPeaks = Array.from(sanitized.waveformPeaks);
    }
    return removeUndefinedFields(sanitized);
  }

  async saveSong(song: any, stemsData: { id: string, buffer: ArrayBuffer }[]): Promise<void> {
    if (!this.db) await this.init();
    
    const sanitizedSong = this.sanitizeSong(song);
    
    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(['songs', 'stems'], 'readwrite');
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = (err) => reject(err);

      const songStore = transaction.objectStore('songs');
      songStore.put(sanitizedSong);

      const stemStore = transaction.objectStore('stems');
      stemsData.forEach(stem => {
        stemStore.put(stem);
      });
    });

    if (auth.currentUser) {
      const userId = auth.currentUser.uid;
      // Save metadata
      setDoc(doc(db, 'users', userId, 'songs', sanitizedSong.id), sanitizedSong).catch(console.error);
      
      // Save stems
      stemsData.forEach(stem => {
        const fileRef = ref(storage, `users/${userId}/stems/${stem.id}`);
        uploadBytes(fileRef, stem.buffer).catch(console.error);
      });
    }
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

  async getAllDownloadedStemIds(): Promise<string[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['stems'], 'readonly');
      const store = transaction.objectStore('stems');
      const request = store.getAllKeys();
      request.onsuccess = () => {
        resolve((request.result || []).map(k => k.toString()));
      };
      request.onerror = (err) => reject(err);
    });
  }

  async loadStemBuffer(id: string): Promise<ArrayBuffer | null> {
    if (!this.db) await this.init();
    
    let buffer: ArrayBuffer | null = await new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['stems'], 'readonly');
      const store = transaction.objectStore('stems');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result ? request.result.buffer : null);
      request.onerror = (err) => reject(err);
    });

    if (!buffer && auth.currentUser) {
      try {
        const fileRef = ref(storage, `users/${auth.currentUser.uid}/stems/${id}`);
        buffer = await getBytes(fileRef);
        
        if (buffer) {
          const transaction = this.db!.transaction(['stems'], 'readwrite');
          transaction.objectStore('stems').put({ id, buffer });
        }
      } catch (err) {
         // Might not exist or network issue
         console.warn("Stem not found in cloud either", id);
      }
    }
    
    return buffer;
  }

  async loadStemBuffers(ids: string[]): Promise<Map<string, ArrayBuffer>> {
    if (!this.db) await this.init();
    
    const results = new Map<string, ArrayBuffer>();
    const missingIds: string[] = [];
    
    // 1. Try to read all of them from IndexedDB in a single transaction
    await new Promise<void>((resolve) => {
      const transaction = this.db!.transaction(['stems'], 'readonly');
      const store = transaction.objectStore('stems');
      
      let completedCount = 0;
      if (ids.length === 0) {
        resolve();
        return;
      }
      
      ids.forEach(id => {
        const request = store.get(id);
        request.onsuccess = () => {
          if (request.result && request.result.buffer) {
            results.set(id, request.result.buffer);
          } else {
            missingIds.push(id);
          }
          completedCount++;
          if (completedCount === ids.length) {
            resolve();
          }
        };
        request.onerror = () => {
          missingIds.push(id);
          completedCount++;
          if (completedCount === ids.length) {
            resolve();
          }
        };
      });
    });
    
    // 2. For any missing ones, fetch from cloud in parallel, then save them
    if (missingIds.length > 0 && auth.currentUser) {
      const userId = auth.currentUser.uid;
      const fetchPromises = missingIds.map(async (id) => {
        try {
          const fileRef = ref(storage, `users/${userId}/stems/${id}`);
          const buffer = await getBytes(fileRef);
          if (buffer) {
            results.set(id, buffer);
            // Save back to IndexedDB
            const transaction = this.db!.transaction(['stems'], 'readwrite');
            transaction.objectStore('stems').put({ id, buffer });
          }
        } catch (err) {
          console.warn("Stem not found in cloud either:", id, err);
        }
      });
      await Promise.all(fetchPromises);
    }
    
    return results;
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

  async saveSetlist(setlist: { id: string, name: string, songIds: string[], songs?: any[] }): Promise<void> {
    if (!this.db) await this.init();
    
    const sanitizedSetlist = removeUndefinedFields({
      ...setlist,
      songs: setlist.songs ? setlist.songs.map(song => this.sanitizeSong(song)) : undefined
    });
    
    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(['setlists'], 'readwrite');
      transaction.oncomplete = () => resolve();
      transaction.onerror = (err) => reject(err);
      transaction.objectStore('setlists').put(sanitizedSetlist);
    });

    if (auth.currentUser) {
      setDoc(doc(db, 'users', auth.currentUser.uid, 'setlists', setlist.id), sanitizedSetlist).catch(console.error);
    }
  }

  async deleteSetlist(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(['setlists'], 'readwrite');
      transaction.oncomplete = () => resolve();
      transaction.onerror = (err) => reject(err);
      transaction.objectStore('setlists').delete(id);
    });

    if (auth.currentUser) {
      deleteDoc(doc(db, 'users', auth.currentUser.uid, 'setlists', id)).catch(console.error);
    }
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
