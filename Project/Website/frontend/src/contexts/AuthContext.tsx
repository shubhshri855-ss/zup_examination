import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase'

export type Role = 'student' | 'admin' | 'invigilator' | null;

interface AuthContextType {
  role: Role;
  user: FirebaseUser | null;
  loading: boolean;
  setRoleOverride: (r: Role) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch role from Firestore database
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const fetchedRole = docSnap.data().role as Role;
            setRole(fetchedRole);
            if (fetchedRole) {
              localStorage.setItem('auth_role', fetchedRole);
            }
          } else {
            // Default role if doc not created yet, but check localStorage to prevent race condition during signup
            const localRole = localStorage.getItem('auth_role') as Role;
            setRole(localRole || 'student');
          }
        } catch(e) {
          console.error("Firebase config is likely missing or Firestore read failed.", e);
          // Fallback to local storage for demo if Firebase isn't set up yet
          const localRole = localStorage.getItem('auth_role') as Role;
          setRole(localRole || 'student');
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch(e) {
      console.log("Firebase signout error (or using mock):", e);
    }
    setRole(null);
    localStorage.removeItem('auth_role');
  };

  const setRoleOverride = (newRole: Role) => {
    setRole(newRole);
    if(newRole) localStorage.setItem('auth_role', newRole);
  };

  return (
    <AuthContext.Provider value={{ role, user, loading, logout, setRoleOverride }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
