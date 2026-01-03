// Firestore service for data storage
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch
} from "firebase/firestore";
import { db } from "../firebase/config";

// Helper to convert Firestore Timestamp to Date string
const timestampToString = (timestamp: any): string => {
  if (!timestamp) return '';
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  if (timestamp?.toDate) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

// Helper to convert Date string to Firestore Timestamp
const stringToTimestamp = (dateString: string): Timestamp | null => {
  if (!dateString) return null;
  try {
    return Timestamp.fromDate(new Date(dateString));
  } catch {
    return null;
  }
};

// Helper to clean data before saving (convert dates to timestamps)
const prepareDataForFirestore = (data: any): any => {
  if (data === null || data === undefined) return null;
  if (Array.isArray(data)) {
    return data.map(item => prepareDataForFirestore(item));
  }
  if (typeof data === 'object' && data.constructor === Object) {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Skip functions and undefined
      if (typeof value === 'function' || value === undefined) continue;
      
      // Convert date strings to timestamps
      if (typeof value === 'string' && (key.includes('date') || key.includes('Date') || key.includes('createdAt') || key.includes('updatedAt'))) {
        const timestamp = stringToTimestamp(value);
        if (timestamp) {
          cleaned[key] = timestamp;
        } else {
          cleaned[key] = value;
        }
      } else if (typeof value === 'object' && value !== null) {
        cleaned[key] = prepareDataForFirestore(value);
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }
  return data;
};

// Helper to clean data after reading (convert timestamps to date strings)
const prepareDataFromFirestore = (data: any): any => {
  if (data === null || data === undefined) return null;
  if (Array.isArray(data)) {
    return data.map(item => prepareDataFromFirestore(item));
  }
  if (typeof data === 'object' && data.constructor === Object) {
    // Check if it's a Timestamp
    if (data instanceof Timestamp || data?.toDate) {
      return timestampToString(data);
    }
    
    const cleaned: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value instanceof Timestamp || value?.toDate) {
        cleaned[key] = timestampToString(value);
      } else if (typeof value === 'object' && value !== null) {
        cleaned[key] = prepareDataFromFirestore(value);
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }
  return data;
};

export const firestoreService = {
  /**
   * Save entire state to Firestore
   */
  saveToCloud: async (fullState: any) => {
    try {
      const batch = writeBatch(db);
      
      // Save each collection
      const collections = [
        'users', 'tasks', 'projects', 'tables', 'docs', 'folders',
        'meetings', 'contentPosts', 'activity', 'statuses', 'priorities',
        'clients', 'contracts', 'employeeInfos', 'deals', 'notificationPrefs',
        'departments', 'financeCategories', 'financePlan', 'purchaseRequests',
        'orgPositions', 'businessProcesses', 'automationRules',
        'warehouses', 'inventoryItems', 'stockMovements'
      ];

      for (const collectionName of collections) {
        const data = fullState[collectionName];
        if (data === undefined || data === null) continue;

        const collectionRef = collection(db, collectionName);
        
        if (Array.isArray(data)) {
          // Save each document in the array
          for (const item of data) {
            if (!item || !item.id) continue;
            const docRef = doc(collectionRef, item.id);
            const cleanedData = prepareDataForFirestore(item);
            batch.set(docRef, cleanedData);
          }
        } else if (typeof data === 'object') {
          // Save as single document (like financePlan)
          const docRef = doc(collectionRef, 'default');
          const cleanedData = prepareDataForFirestore(data);
          batch.set(docRef, cleanedData);
        }
      }

      await batch.commit();
      return true;
    } catch (error) {
      // Firestore Save Error
      return false;
    }
  },

  /**
   * Load entire state from Firestore
   */
  loadFromCloud: async (): Promise<any> => {
    try {
      const collections = [
        'users', 'tasks', 'projects', 'tables', 'docs', 'folders',
        'meetings', 'contentPosts', 'activity', 'statuses', 'priorities',
        'clients', 'contracts', 'employeeInfos', 'deals', 'notificationPrefs',
        'departments', 'financeCategories', 'financePlan', 'purchaseRequests',
        'financialPlanDocuments', 'financialPlannings',
        'orgPositions', 'businessProcesses', 'automationRules',
        'warehouses', 'inventoryItems', 'stockMovements'
      ];

      const state: any = {};

      for (const collectionName of collections) {
        try {
          const collectionRef = collection(db, collectionName);
          const snapshot = await getDocs(collectionRef);
          
          if (collectionName === 'financePlan') {
            // financePlan is a single document
            if (!snapshot.empty) {
              const docData = snapshot.docs[0].data();
              state[collectionName] = prepareDataFromFirestore(docData);
            } else {
              state[collectionName] = null;
            }
          } else {
            // Other collections are arrays
            const items: any[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              items.push(prepareDataFromFirestore({ id: doc.id, ...data }));
            });
            state[collectionName] = items;
          }
        } catch (error) {
          // Error loading collection
          state[collectionName] = collectionName === 'financePlan' ? null : [];
        }
      }

      return state;
    } catch (error) {
      // Firestore Load Error
      return null;
    }
  },

  /**
   * Get all documents from a collection
   */
  getAll: async (collectionName: string): Promise<any[]> => {
    try {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);
      const items: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push(prepareDataFromFirestore({ id: doc.id, ...data }));
      });
      return items;
    } catch (error) {
      // Error getting all items
      return [];
    }
  },

  /**
   * Get a single document by ID
   */
  getById: async (collectionName: string, id: string): Promise<any | null> => {
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return prepareDataFromFirestore({ id: docSnap.id, ...data });
      }
      return null;
    } catch (error) {
      // Error getting item
      return null;
    }
  },

  /**
   * Save a single document
   */
  save: async (collectionName: string, data: any): Promise<boolean> => {
    try {
      if (!data || !data.id) {
        // Cannot save: missing id
        return false;
      }
      const docRef = doc(db, collectionName, data.id);
      const cleanedData = prepareDataForFirestore(data);
      await setDoc(docRef, cleanedData, { merge: true });
      return true;
    } catch (error) {
      // Error saving item
      return false;
    }
  },

  /**
   * Delete a document
   */
  delete: async (collectionName: string, id: string): Promise<boolean> => {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      // Error deleting item
      return false;
    }
  }
};

