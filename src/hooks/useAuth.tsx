import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "@/integrations/firebase/config";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signOut as firebaseSignOut
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import type { Profile } from "@/integrations/firebase/types";

export const useAuth = (requiredType?: "recruiter" | "candidate") => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        await fetchUserProfile(firebaseUser.uid);
      } else {
        setUserType(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const profileDoc = await getDoc(doc(db, "profiles", userId));

      if (profileDoc.exists()) {
        const profileData = profileDoc.data() as Profile;
        const userTypeValue = profileData.user_type || null;
        setUserType(userTypeValue);

        // Only redirect if requiredType is specified and doesn't match
        if (requiredType && userTypeValue !== requiredType) {
          console.log(`User type ${userTypeValue} doesn't match required ${requiredType}, redirecting...`);
          navigate("/auth");
        }
      } else {
        setUserType(null);
        // If no profile exists and requiredType is specified, redirect
        if (requiredType) {
          console.log("No profile found, redirecting...");
          navigate("/auth");
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      // Don't redirect on error, just log it
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    navigate("/auth");
  };

  return { user, loading, userType, signOut };
};
