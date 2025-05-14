import admin from "firebase-admin";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Enhanced debug logging
console.log("====== Firebase Initialization ======");
console.log("Environment:", process.env.NODE_ENV || "development");
console.log("Project ID:", process.env.FIREBASE_PROJECT_ID ? "√ Set" : "✗ Missing");
console.log("Client Email:", process.env.FIREBASE_CLIENT_EMAIL ? "√ Set" : "✗ Missing");
console.log("Private Key:", process.env.FIREBASE_PRIVATE_KEY ? "√ Set" : "✗ Missing");

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
    console.log("Private key format:", validPrivateKey ? "√ Valid" : "✗ Invalid");
  } catch (error) {
    console.error("Error formatting private key:", error);
    validPrivateKey = false;
  }
} else {
  console.error("FIREBASE_PRIVATE_KEY environment variable is missing or empty");
}

// Default development credentials if environment variables are missing
const DEV_PROJECT_ID = "civic-connect-app-dev";
const DEV_CLIENT_EMAIL = "firebase-adminsdk-dev@civic-connect-app-dev.iam.gserviceaccount.com";
// This is a mock private key for development purposes only
const DEV_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCtxF+KupcFVmeO
R2gKD/FAeHHh/x0jfXGiZ0PS4hOkI3JIy3YcqGVVG9UZg5+RmNU7XJeDEd8AHekH
LvQ5NBXwflfBKMywrZ8C8i9Qa2/vulRzeW4FKbLcDxzYD9bsQZRqXBE/wC9Z1eLw
CPbBrjYuL7GjkZnTDkjvVzsgsKGfYnJcHHp2Vdo1JZI1SItqyYEBY4+Jt13q0ogn
G4ZkUdZ4BbDC7a1mCbGNQ7wFY35UBk9A0arIjpBKCrXv4LVl+c1fVZ4XD0SJWZXS
A+KvLUSJk5H7jBIPQN0cxM4tHhMKKSVZ9LL+wCmBPvszEFGQG5ZkLnWTp1aEGw3Y
VCr5HS41AgMBAAECggEABZwNP8uVFQMGoWJ7Vay1HQCnCAgj3ZIZyDOEdnCBlk+O
RkXfOhG4JnQfEZfRrrnlMUbfAUYFQG7xdiZdPLYpYkV9Pm+X3OIIFhvxr4tGNkRO
e8K4SQKBgQDZVnfGkfZ2x4/8+kOzDqSKdgNUm90SsYhlCT3XbmODx1/uDWfJEE57
LYmcuE8HDJw9QOJ5I+jeEJR4pLCgkYN2L/LOUjp2daDQcFJv4yGYWAdYmMN7Wgrq
uDzZXNLfZdTsMKcZ3aKpLy3yLdCCwm0JqpA/6lG1h70XoyVO7cGGSQKBgQDMc+GC
QQJ1ypTwhQJyAZHPEzamgxXxN5PdhDeO2fMz0Sp7qQKKYtEi+o0z3ZAKtAiixmvy
fJGbNyuWEpTnRQxRg28WLYtAFB5jvx5L51xGQqEO+Eajj0svXHdiuW9K56RxbTHx
TQvdHRIXKGPJYGW2Kf+YLXfNYPCRIZ4ZM8ZE7QKBgQCIq9JKNXBDlGdU9rQiwUQr
FQFSMITJ1KvqFm1glq4gPFOYI0CWKgUQPPYWjG2uAMHPPpZ/aSVCGDI6NFrZPRWX
ta/iLMiHY9E8e4XnXKh7BcXyVRpvkV5z6KNefYxXUGzRuO9nQNvkXpGjdGw2/SE4
KTEbYUcKdJ8rCI1z4kxCkQKBgAmcjd9wZyn9NZShUUhXwNCwLwQIs8K4ByA0LRgf
EukV43OBVzzlFK59/pXyJCbGFQKsN7uxuSHVD4bRQOVyDqUUZKY+eXQBMBjNd3O5
k5HLLFhUUHUenQGkRYrMGv6NVlWuuqj6nfl8TI2kblF9CYXRJIZrUBrPdGDvcQSC
r1GpAoGAa7N3CC2qEW3l3UiwrWVZKA49dGzBbm0mAEqTrQP3AgVXUXzR9F+KLJ76
DZQPXjXEA0F+rbn5dOYEYYMI76+W1c8RWLQHqrxCjNkxj4PrK8TAbrj47vjSb+0U
gqCdXbZxmJOddtLQ5G/fNabaXGYLJhFBm3nxXgXdexKNzdgN554=
-----END PRIVATE KEY-----`;

// Mock database to use when Firebase is not available
class MockFirestore {
  private collections: Record<string, any[]> = {
    users: [],
    issues: [],
    comments: [],
    organizations: []
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
    // Check if we're in development mode
    const isDev = process.env.NODE_ENV === 'development';
    
    // For development, we can use default credentials or mock if needed
    const projectId = process.env.FIREBASE_PROJECT_ID || (isDev ? DEV_PROJECT_ID : undefined);
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || (isDev ? DEV_CLIENT_EMAIL : undefined);
    const formattedPrivateKey = validPrivateKey ? privateKey : (isDev ? DEV_PRIVATE_KEY : undefined);
    
    if (projectId && clientEmail && formattedPrivateKey) {
      try {
        const firebaseConfig = {
          credential: admin.credential.cert({
            projectId: projectId,
            clientEmail: clientEmail,
            privateKey: formattedPrivateKey
          } as admin.ServiceAccount)
        };
        
        admin.initializeApp(firebaseConfig);
        console.log("✅ Firebase Admin initialized successfully");
        
        auth = admin.auth();
        db = admin.firestore();
      } catch (certError) {
        console.error("❌ Firebase credential error:", certError);
        
        // In development, fall back to the mock database
        if (isDev) {
          throw new Error("Falling back to mock database");
        } else {
          throw certError;
        }
      }
    } else {
      throw new Error("Invalid Firebase credentials - Check that all required environment variables are set");
    }
  } else {
    auth = admin.auth();
    db = admin.firestore();
  }
} catch (error) {
  console.error("❌ Firebase Admin initialization error:", error);
  
  // In development, we can continue without Firebase to allow testing
  if (process.env.NODE_ENV !== 'production') {
    console.warn("🔶 Running in development mode with mock database");
    db = new MockFirestore();
    auth = {
      verifyIdToken: async (token: string) => {
        console.log(`[MOCK AUTH] Verifying token: ${token.substring(0, 10)}...`);
        return { 
          uid: 'mock-user-id', 
          email: 'mock@example.com',
          role: 'user',
          isOrganization: false
        };
      },
      setCustomUserClaims: async (uid: string, claims: any) => {
        console.log(`[MOCK AUTH] Setting custom claims for ${uid}:`, claims);
        return Promise.resolve();
      }
    };
  } else {
    throw error;
  }
}

export { auth, db }; 