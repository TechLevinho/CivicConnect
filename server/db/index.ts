import { DatabaseAdapter } from "./types";
import { FirebaseAdapter } from "./firebase";
import { DatabaseStorage } from "./storage";

const useFirebase = process.env.DB_PROVIDER === "firebase";

export const getDatabase = (): DatabaseAdapter => {
  if (useFirebase) {
    return new FirebaseAdapter();
  }
  return new DatabaseStorage();
};

export const db = getDatabase(); 