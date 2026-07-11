import { db, storage, auth } from './firebase';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getBytes, deleteObject } from 'firebase/storage';

export class StorageEngine {
  private dbName = 'PrimeMultitrackDB';
  private dbVersion = 2;
  private db: IDBDatabase | null = null;
  private syncing = false;

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

  async saveSong(song: any, stemsData: { id: string, buffer: ArrayBuffer }[]): Promise<void> {
    if (!this.db) await this.init();
    
    await new Promise<void>((resolve, reject) => {
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

    if (auth.currentUser) {
      const userId = auth.currentUser.uid;
      // Save metadata
      setDoc(doc(db, 'users', userId, 'songs', song.id), song).catch(console.error);
      
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
    
    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(['setlists'], 'readwrite');
      transaction.oncomplete = () => resolve();
      transaction.onerror = (err) => reject(err);
      transaction.objectStore('setlists').put(setlist);
    });

    if (auth.currentUser) {
      setDoc(doc(db, 'users', auth.currentUser.uid, 'setlists', setlist.id), setlist).catch(console.error);
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
