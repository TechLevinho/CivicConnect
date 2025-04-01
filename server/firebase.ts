import admin from "firebase-admin";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Debug logging
console.log("Environment variables:");
console.log("Project ID:", process.env.FIREBASE_PROJECT_ID);
console.log("Client Email:", process.env.FIREBASE_CLIENT_EMAIL);

// Create a proper PEM format private key
let privateKey = process.env.FIREBASE_PRIVATE_KEY;
let validPrivateKey = false;

if (privateKey) {
  try {
    // Remove any quotes
    privateKey = privateKey.replace(/^["']|["']$/g, '');
    
    // Replace literal \n with actual newlines
    privateKey = privateKey.replace(/\\n/g, "\n");
    
    // Make sure it has the proper PEM header and footer
    if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
      privateKey = "-----BEGIN PRIVATE KEY-----\n" + 
        privateKey + 
        "\n-----END PRIVATE KEY-----\n";
    }
    
    validPrivateKey = privateKey.includes("BEGIN PRIVATE KEY") && 
                       privateKey.includes("END PRIVATE KEY");
    console.log("Private key PEM format created:", validPrivateKey ? "Valid" : "Invalid");
  } catch (error) {
    console.error("Error formatting private key:", error);
    validPrivateKey = false;
  }
}

// Mock database to use when Firebase is not available
class MockFirestore {
  private collections: Record<string, any[]> = {
    users: [],
    issues: [],
    comments: []
  };

  collection(name: string) {
    if (!this.collections[name]) {
      this.collections[name] = [];
    }

    return {
      add: async (data: any) => {
        const id = Math.random().toString(36).substring(2, 15);
        this.collections[name].push({ id, ...data });
        console.log(`[MOCK DB] Added document to ${name}:`, { id, ...data });
        return { id };
      },
      doc: (id: string) => ({
        get: async () => {
          const doc = this.collections[name].find(doc => doc.id === id);
          return {
            exists: !!doc,
            id: id,
            data: () => doc
          };
        },
        set: async (data: any) => {
          const index = this.collections[name].findIndex(doc => doc.id === id);
          if (index >= 0) {
            this.collections[name][index] = { id, ...data };
          } else {
            this.collections[name].push({ id, ...data });
          }
          console.log(`[MOCK DB] Set document in ${name}:`, { id, ...data });
          return { id };
        },
        update: async (data: any) => {
          const index = this.collections[name].findIndex(doc => doc.id === id);
          if (index >= 0) {
            this.collections[name][index] = { ...this.collections[name][index], ...data };
            console.log(`[MOCK DB] Updated document in ${name}:`, this.collections[name][index]);
          }
          return { id };
        }
      }),
      where: () => ({
        get: async () => ({
          empty: true,
          docs: []
        }),
        orderBy: () => ({
          get: async () => ({
            empty: true,
            docs: []
          })
        })
      }),
      orderBy: () => ({
        get: async () => ({
          empty: true,
          docs: []
        })
      }),
      get: async () => ({
        empty: true,
        docs: []
      })
    };
  }
}

// Initialize Firebase or Mock Database
let db: any;
let auth: any;

try {
  // Check if app is already initialized
  if (!admin.apps.length) {
    if (validPrivateKey && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL) {
      const firebaseConfig = {
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey
        } as admin.ServiceAccount)
      };
      
      admin.initializeApp(firebaseConfig);
      console.log("Firebase Admin initialized successfully");
      
      auth = admin.auth();
      db = admin.firestore();
    } else {
      throw new Error("Invalid Firebase credentials");
    }
  } else {
    auth = admin.auth();
    db = admin.firestore();
  }
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
  
  // In development, we can continue without Firebase to allow testing
  if (process.env.NODE_ENV !== 'production') {
    console.warn("🔶 Running in development mode with mock database");
    db = new MockFirestore();
    auth = {
      verifyIdToken: async () => ({ uid: 'mock-user-id', email: 'mock@example.com' }),
      setCustomUserClaims: async () => {}
    };
  } else {
    throw error;
  }
}

export { auth, db }; 