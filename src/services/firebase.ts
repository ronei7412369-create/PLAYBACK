import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Create/update user document in firestore
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      const trialEndsAtDate = new Date();
      trialEndsAtDate.setDate(trialEndsAtDate.getDate() + 3);

      const data: any = {
        email: user.email,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        trialEndsAt: trialEndsAtDate,
        isPaid: false
      };
      if (user.displayName) data.displayName = user.displayName;
      if (user.photoURL) data.photoURL = user.photoURL;
      
      await setDoc(userRef, data);
    } else {
      const data: any = {
        lastLogin: serverTimestamp(),
      };
      if (user.displayName) data.displayName = user.displayName;
      if (user.photoURL) data.photoURL = user.photoURL;
      
      await setDoc(userRef, data, { merge: true });
    }
    
    return user;
  } catch (error) {
    console.error("Error signing in with Google: ", error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    const trialEndsAtDate = new Date();
    trialEndsAtDate.setDate(trialEndsAtDate.getDate() + 3);

    if (!userDoc.exists()) {
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        trialEndsAt: trialEndsAtDate,
        isPaid: false
      });
    } else {
      await setDoc(userRef, {
        lastLogin: serverTimestamp(),
      }, { merge: true });
    }
    
    return user;
  } catch (error) {
    console.error("Error signing in with Email: ", error);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, password: string, displayName: string = '') => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    const trialEndsAtDate = new Date();
    trialEndsAtDate.setDate(trialEndsAtDate.getDate() + 3);

    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      email: user.email,
      displayName: displayName || user.email?.split('@')[0],
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      trialEndsAt: trialEndsAtDate,
      isPaid: false
    });
    
    return user;
  } catch (error) {
    console.error("Error signing up with Email: ", error);
    throw error;
  }
};

export const createInternalUserWithEmail = async (email: string, password: string, displayName: string = '') => {
  try {
    const secondaryApp = initializeApp(firebaseConfig, "Secondary");
    const secondaryAuth = getAuth(secondaryApp);
    
    const result = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const user = result.user;
    
    const trialEndsAtDate = new Date();
    trialEndsAtDate.setDate(trialEndsAtDate.getDate() + 3);

    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      email: user.email,
      displayName: displayName || user.email?.split('@')[0],
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      trialEndsAt: trialEndsAtDate,
      isPaid: false
    });
    
    await fbSignOut(secondaryAuth);
    
    return user;
  } catch (error) {
    console.error("Error creating internal user: ", error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await fbSignOut(auth);
  } catch (error) {
    console.error("Error signing out: ", error);
    throw error;
  }
};
