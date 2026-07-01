import React, { useState, useEffect } from "react";
import { onAuthStateChanged, signOut, sendEmailVerification } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./lib/firebase";
import { UserProfile, UserRole } from "./types";
import { parsePcampusEmail } from "./utils/helpers";

import AuthScreen from "./components/AuthScreen";
import Navbar from "./components/Navbar";
import HomeView from "./components/HomeView";
import AboutView from "./components/AboutView";
import ProfilesView from "./components/ProfilesView";
import EventsView from "./components/EventsView";
import ExploreView from "./components/ExploreView";
import AdminView from "./components/AdminView";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole>("student");
  const [currentTab, setCurrentTab] = useState<string>("home");
  const [loading, setLoading] = useState<boolean>(true);

  const [verificationMsg, setVerificationMsg] = useState<string>("");
  const [sendingVerification, setSendingVerification] = useState<boolean>(false);
  const [checkingVerification, setCheckingVerification] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;
    setSendingVerification(true);
    setVerificationMsg("");
    try {
      await sendEmailVerification(auth.currentUser);
      setVerificationMsg("Link sent. Check your inbox and spam folder.");
    } catch (err: any) {
      console.error("Resend error:", err);
      setVerificationMsg("Failed to resend: " + (err.message || "An unexpected error occurred."));
    } finally {
      setSendingVerification(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!auth.currentUser) return;
    setVerificationMsg("");
    setCheckingVerification(true);
    try {
      await auth.currentUser.reload();
      const updatedUser = auth.currentUser;
      setUser(updatedUser);
      setIsVerified(updatedUser.emailVerified);
      if (!updatedUser.emailVerified) {
        setVerificationMsg("Still not verified. Click the link in your inbox first.");
      }
    } catch (err: any) {
      console.error("Check error:", err);
      setVerificationMsg("Failed to refresh: " + (err.message || "An unexpected error occurred."));
    } finally {
      setCheckingVerification(false);
    }
  };

  // Auto-recheck the moment they switch back to this tab — covers the
  // common case where they clicked the email link in a different tab and
  // just came back, without needing to press "I've verified" manually.
  useEffect(() => {
    if (!user || isVerified) return;
    const onFocus = () => handleCheckVerification();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user, isVerified]);

  const fetchProfileAndRole = async (uid: string, email: string) => {
    try {
      // 1. Fetch Profile
      const profileRef = doc(db, "users", uid);
      const profileSnap = await getDoc(profileRef);

      let profileData: UserProfile;
      if (profileSnap.exists()) {
        profileData = profileSnap.data() as UserProfile;
      } else {
        // Fallback profile hydration from parsed email details
        const parsed = parsePcampusEmail(email);
        profileData = {
          uid,
          name: parsed?.name || "BCT Student",
          email: email,
          skills: [],
          socials: {},
          rollNumber: parsed?.rollNumber || "",
          batchYear: parsed?.batchYear || "",
          photoURL: `https://api.dicebear.com/7.x/identicon/svg?seed=${uid}`,
        };
        await setDoc(profileRef, profileData);
      }
      setUserProfile(profileData);

      // 2. Fetch Role
      const roleRef = doc(db, "roles", uid);
      const roleSnap = await getDoc(roleRef);

      let role: UserRole = "student";
      if (roleSnap.exists()) {
        role = roleSnap.data().role as UserRole;
      } else {
        // Fallback root admin seeding check
        role = email === "082bct013.apil@pcampus.edu.np" ? "admin" : "student";
        await setDoc(roleRef, {
          uid,
          email,
          role,
          grantedBy: "system",
          grantedAt: new Date(),
        });
      }
      setUserRole(role);
    } catch (err) {
      console.error("Error loading user profile & role:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true); // stays true until we're 100% sure — blocks all rendering below
      if (currentUser) {
        // Reload first so emailVerified reflects the current server state,
        // not a cached value from an older session/token (this matters
        // most right after a page refresh, where Firebase restores a
        // persisted session before revalidating it).
        try {
          await currentUser.reload();
        } catch (err) {
          console.error("Failed to reload user:", err);
        }
        const freshUser = auth.currentUser;

        setUser(freshUser);
        setIsVerified(freshUser?.emailVerified ?? false);

        if (freshUser?.emailVerified) {
          await fetchProfileAndRole(freshUser.uid, freshUser.email || "");
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setUserRole("student");
        setCurrentTab("home");
        setIsVerified(false);
      }
      setLoading(false); // only now does the component render past the spinner
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut(auth);
    } catch (err) {
      console.error("Error signing out:", err);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = () => {
    if (user) {
      fetchProfileAndRole(user.uid, user.email || "");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center font-serif">
        <div className="bg-[#111111] text-[#F4C430] p-4 font-mono font-bold text-xl tracking-tighter border border-[#111111] animate-pulse">
          BCT
        </div>
        <div className="text-xs text-[#8A8A8A] uppercase tracking-wider font-bold mt-4 animate-pulse">
          Establishing Connection to Portal...
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onSuccess={() => {}} />;
  }

  // NEW: this is the actual gate. Nothing below this — Navbar, tabs,
  // profile data — renders until Firebase confirms the email is verified.
  // Previously the app rendered fully with just a dismissible banner,
  // which meant an unverified account could already use everything.
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-serif text-center">
        <p className="text-xs uppercase tracking-widest text-[#8A8A8A] font-sans mb-3">
          {user.email}
        </p>
        <h1 className="text-2xl font-bold text-[#111111] mb-6">
          Verify your email
        </h1>

        <button
          onClick={handleResendVerification}
          disabled={sendingVerification}
          className="bg-[#111111] text-[#F4C430] px-6 py-3 text-xs font-sans font-bold uppercase tracking-widest hover:bg-[#F4C430] hover:text-[#111111] transition-all disabled:opacity-50"
        >
          {sendingVerification ? "Sending..." : "Send verification link"}
        </button>

        {verificationMsg && (
          <p className="text-[10px] text-[#8A8A8A] font-sans uppercase tracking-widest mt-4 max-w-xs">
            {verificationMsg}
          </p>
        )}

        <button
          onClick={handleCheckVerification}
          disabled={checkingVerification}
          className="mt-6 text-[10px] text-[#8A8A8A] font-sans uppercase font-bold tracking-widest hover:text-[#111111] hover:underline disabled:opacity-50"
        >
          {checkingVerification ? "Checking…" : "I've verified — continue"}
        </button>

        <button
          onClick={handleSignOut}
          className="mt-3 text-[10px] text-[#8A8A8A] font-sans uppercase font-bold tracking-widest hover:text-[#111111] hover:underline"
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar
        currentTab={currentTab}
        onNavigate={setCurrentTab}
        userProfile={userProfile}
        userRole={userRole}
        onSignOut={handleSignOut}
      />

      <main className="flex-1 pb-16 bg-white">
        {currentTab === "home" && (
          <HomeView
            onNavigate={setCurrentTab}
            isAuthenticated={!!user}
            onOpenAuth={() => {}}
          />
        )}

        {currentTab === "about" && (
          <AboutView />
        )}

        {currentTab === "profiles" && (
          <ProfilesView
            currentUserUid={user.uid}
            currentUserProfile={userProfile}
            currentUserRole={userRole}
            onRefreshProfile={refreshProfile}
          />
        )}

        {currentTab === "events" && (
          <EventsView
            currentUserUid={user.uid}
            currentUserEmail={user.email || ""}
            currentUserRole={userRole}
          />
        )}

        {currentTab === "explore" && (
          <ExploreView
            currentUserUid={user.uid}
          />
        )}

        {currentTab === "admin" && (
          <AdminView
            currentUserUid={user.uid}
            currentUserRole={userRole}
          />
        )}
      </main>

      {/* Footer bar */}
      <footer className="border-t border-[#E5E5E5] bg-[#FFFFFF] py-6 text-center font-serif text-xs text-[#8A8A8A]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            &copy; 2026 Pulchowk Campus BCT Department. All Rights Reserved.
          </div>
          <div className="flex gap-4">
            <span className="font-bold text-[#111111]">Secured with Firestore Security Rules</span>
            <span>•</span>
            <span>Local Time: {new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}