import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot, 
  query, 
  where, 
  orderBy,
  getDocs,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from 'firebase/storage';
import { 
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from 'firebase/auth';

// Check if Firebase environment variables are configured
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const isConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'YOUR_FIREBASE_API_KEY' &&
  firebaseConfig.projectId;

let db: any;
let storage: any;
let auth: any;
let realFirebaseActive = false;

if (isConfigured) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
    realFirebaseActive = true;
    console.log('Firebase initialized successfully.');
  } catch (err) {
    console.error('Firebase failed to initialize, falling back to mock services:', err);
  }
}

// Custom Event Bus for mock real-time updates
class EventBus {
  private listeners: { [key: string]: Function[] } = {};

  subscribe(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  publish(event: string) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb());
    }
  }
}

const mockEventBus = new EventBus();

// Helper to load/save mock Firestore from localStorage
const getLocalStorageData = (key: string): any[] => {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : [];
};

const saveLocalStorageData = (key: string, data: any[]) => {
  localStorage.setItem(key, JSON.stringify(data));
  mockEventBus.publish(key);
};

// Fallback Mock Implementations
if (!realFirebaseActive) {
  console.warn('Firebase keys missing. Running in local mock mode (with real-time updates synced via localStorage).');

  // Initialize storage keys with default complaints if empty
  if (!localStorage.getItem('fb_complaints')) {
    const defaultComplaints = [
      {
        id: 'COMP-101001',
        title: 'Debris blocking curbside lane',
        description: 'A large pile of construction aggregates and metal frames has blocked the left lane of Nicoll Highway near Stadium Rd. Cars are forced to switch lanes abruptly.',
        location: 'Nicoll Highway Westbound',
        imageUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=400&q=80',
        status: 'Verified',
        createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
        citizenId: 'citizen_demo',
        priority: 'High',
        hazardType: 'Road Blockage',
        upvotes: 18,
        upvotedBy: [],
        satisfactionScore: 0,
        resolutionQualityScore: 0
      },
      {
        id: 'COMP-101002',
        title: 'Severe road surface decay and aggregate loss',
        description: 'Asphalt is coming apart on Serangoon Road. Potholes are starting to merge, throwing loose gravel at windscreens.',
        location: 'Serangoon Road Section 2',
        imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=80',
        status: 'Repair In Progress',
        createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
        citizenId: 'citizen_demo',
        priority: 'High',
        hazardType: 'Road Crack',
        upvotes: 34,
        upvotedBy: [],
        satisfactionScore: 0,
        resolutionQualityScore: 0
      },
      {
        id: 'COMP-101003',
        title: 'Pothole development at crosswalk',
        description: 'Small but deep pothole formed right in the middle of the pedestrian crossing. Tripping hazard for pedestrians.',
        location: 'Victoria St / Bras Basah Junction',
        imageUrl: 'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=400&q=80',
        status: 'Submitted',
        createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
        citizenId: 'citizen_demo',
        priority: 'Critical',
        hazardType: 'Large Pothole',
        upvotes: 5,
        upvotedBy: [],
        satisfactionScore: 0,
        resolutionQualityScore: 0
      }
    ];
    localStorage.setItem('fb_complaints', JSON.stringify(defaultComplaints));
  }

  if (!localStorage.getItem('fb_notifications')) {
    const defaultNotifications = [
      {
        id: 'notif-1',
        title: 'Complaint Submitted',
        message: 'Your report "Pothole development at crosswalk" has been successfully submitted.',
        timestamp: new Date(Date.now() - 1 * 3600000).toISOString(),
        read: false,
        citizenId: 'citizen_demo'
      },
      {
        id: 'notif-2',
        title: 'Complaint Verified',
        message: 'Your report "Debris blocking curbside lane" has been verified by municipal team.',
        timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
        read: true,
        citizenId: 'citizen_demo'
      }
    ];
    localStorage.setItem('fb_notifications', JSON.stringify(defaultNotifications));
  }

  db = {
    isMock: true,
    collection: (path: string) => ({ path }),
    doc: (path: string, id: string) => ({ path, id }),
  };

  storage = {
    isMock: true
  };
}

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const realGeminiActive = !!(geminiApiKey && geminiApiKey !== 'YOUR_GEMINI_API_KEY' && geminiApiKey !== 'MY_GEMINI_API_KEY');

export { db, storage, auth, realFirebaseActive, realGeminiActive, geminiApiKey };

// Firestore API wrappers that support both real Firebase and fallback local mock
export function getCollectionRef(path: string) {
  return realFirebaseActive ? collection(db, path) : { path };
}

export function getDocRef(path: string, id: string) {
  return realFirebaseActive ? doc(db, path, id) : { path, id };
}

// Real-time query listener
export function subscribeToQuery(queryRef: any, callback: (docs: any[]) => void) {
  if (realFirebaseActive) {
    return onSnapshot(queryRef, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(docs);
    });
  } else {
    // Mock subscription
    const path = queryRef.path || queryRef.colRef?.path;
    const sync = () => {
      let data = getLocalStorageData(`fb_${path}`);
      
      // Apply filters if query contains constraints
      if (queryRef.filters) {
        queryRef.filters.forEach((f: any) => {
          data = data.filter(item => {
            if (f.op === '==') return item[f.field] === f.value;
            if (f.op === 'array-contains') return Array.isArray(item[f.field]) && item[f.field].includes(f.value);
            return true;
          });
        });
      }

      // Apply sorting
      if (queryRef.sorts) {
        queryRef.sorts.forEach((s: any) => {
          data.sort((a, b) => {
            let valA = a[s.field];
            let valB = b[s.field];

            // Handle priority comparison
            if (s.field === 'priority') {
              const priorityWeights: { [key: string]: number } = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
              valA = priorityWeights[valA] || 0;
              valB = priorityWeights[valB] || 0;
            }

            if (typeof valA === 'string' && typeof valB === 'string') {
              return s.dir === 'desc' ? valB.localeCompare(valA) : valA.localeCompare(valB);
            }
            return s.dir === 'desc' ? (valB > valA ? 1 : -1) : (valA > valB ? 1 : -1);
          });
        });
      }

      callback(data);
    };

    sync();
    return mockEventBus.subscribe(`fb_${path}`, sync);
  }
}

// Add Document
export async function addDocument(colRef: any, data: any) {
  if (realFirebaseActive) {
    const docRef = await addDoc(colRef, data);
    return { id: docRef.id, ...data };
  } else {
    const path = colRef.path;
    const storageKey = `fb_${path}`;
    const current = getLocalStorageData(storageKey);
    const id = data.id || `${path.substring(0, 4).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const newDoc = { ...data, id };
    current.unshift(newDoc);
    saveLocalStorageData(storageKey, current);
    return newDoc;
  }
}

// Set Document
export async function setDocument(docRef: any, data: any) {
  if (realFirebaseActive) {
    await setDoc(docRef, data, { merge: true });
    return data;
  } else {
    const parts = docRef.path.split('/');
    const path = parts[0];
    const id = docRef.id;
    const storageKey = `fb_${path}`;
    const current = getLocalStorageData(storageKey);
    const index = current.findIndex(item => item.id === id);
    if (index > -1) {
      current[index] = { ...current[index], ...data };
    } else {
      current.push({ id, ...data });
    }
    saveLocalStorageData(storageKey, current);
    return data;
  }
}

// Update Document
export async function updateDocument(docRef: any, data: any) {
  if (realFirebaseActive) {
    await updateDoc(docRef, data);
    return data;
  } else {
    const path = docRef.path;
    const id = docRef.id;
    const storageKey = `fb_${path}`;
    const current = getLocalStorageData(storageKey);
    const index = current.findIndex(item => item.id === id);
    if (index > -1) {
      current[index] = { ...current[index], ...data };
      saveLocalStorageData(storageKey, current);
      return current[index];
    }
    throw new Error(`Document ${id} not found in mock store ${path}`);
  }
}

// Delete Document
export async function deleteDocument(docRef: any) {
  if (realFirebaseActive) {
    await deleteDoc(docRef);
  } else {
    const parts = docRef.path.split('/');
    const path = parts[0];
    const id = docRef.id;
    const storageKey = `fb_${path}`;
    const current = getLocalStorageData(storageKey);
    const filtered = current.filter(item => item.id !== id);
    saveLocalStorageData(storageKey, filtered);
  }
}

// Query builder for dual-mode
export function buildQuery(colRef: any, ...constraints: any[]) {
  if (realFirebaseActive) {
    return query(colRef, ...constraints);
  } else {
    const filters: any[] = [];
    const sorts: any[] = [];
    constraints.forEach(c => {
      if (c.type === 'where') {
        filters.push({ field: c.field, op: c.op, value: c.value });
      } else if (c.type === 'orderBy') {
        sorts.push({ field: c.field, dir: c.dir });
      }
    });
    return { colRef, filters, sorts, path: colRef.path };
  }
}

// Mock query constraints
export function queryWhere(field: string, op: string, value: any) {
  return realFirebaseActive ? where(field, op as any, value) : { type: 'where', field, op, value };
}

export function queryOrderBy(field: string, dir: 'asc' | 'desc' = 'asc') {
  return realFirebaseActive ? orderBy(field, dir) : { type: 'orderBy', field, dir };
}

// Upload File
export function uploadFile(path: string, file: File, onProgress: (progress: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    if (realFirebaseActive) {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        }, 
        (error) => {
          reject(error);
        }, 
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        }
      );
    } else {
      // Mock File Upload via FileReader to base64
      let progress = 0;
      const interval = setInterval(() => {
        progress += 25;
        onProgress(Math.min(99, progress));
        if (progress >= 100) {
          clearInterval(interval);
          const reader = new FileReader();
          reader.onloadend = () => {
            onProgress(100);
            resolve(reader.result as string);
          };
          reader.onerror = () => {
            reject(new Error('FileReader failed'));
          };
          reader.readAsDataURL(file);
        }
      }, 200);
    }
  });
}
