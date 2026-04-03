import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, getDocs, orderBy, limit, getDocFromServer, doc, serverTimestamp, Timestamp, deleteDoc, updateDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();
export { app };

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}


export interface HistoryRecord {
  uid: string;
  name: string;
  birthInfo: any;
  fateData: any;
  aiReport?: string | null;
  createdAt: Timestamp | number;
}

export const saveFateRecord = async (record: Omit<HistoryRecord, 'createdAt'>) => {
  const path = 'history';
  try {
    return await addDoc(collection(db, path), {
      ...record,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const getHistory = async (uid: string) => {
  const path = 'history';
  try {
    const q = query(
      collection(db, path),
      where('uid', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now()
      } as HistoryRecord & { id: string };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const deleteFateRecord = async (id: string) => {
  const path = `history/${id}`;
  try {
    await deleteDoc(doc(db, 'history', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const updateFateRecord = async (id: string, data: Partial<HistoryRecord>) => {
  const path = `history/${id}`;
  try {
    await updateDoc(doc(db, 'history', id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();
