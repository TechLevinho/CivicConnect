import { DatabaseAdapter } from "./types";
import { FirebaseAdapter } from "./firebase";

// Always use Firebase
export const getDatabase = (): DatabaseAdapter => {
  return new FirebaseAdapter();
};

export const db = getDatabase(); 