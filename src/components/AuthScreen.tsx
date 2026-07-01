import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  User,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { parsePcampusEmail, validatePcampusEmail } from "../utils/helpers";
import { Key, Mail, User as UserIcon, ShieldAlert, Sparkles, HelpCircle, MailCheck } from "lucide-react";

interface AuthScreenProps {
  onSuccess: () => void;
}

export default function AuthScreen({ onSuccess }: AuthScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // NEW: tracks a signed-out-but-not-yet-verified user so we can offer
  // a "resend verification email" action without asking them to log in again.
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  const validateAccess = async (userEmail: string): Promise<boolean> => {
    // 1. Direct Pattern Validation
    if (validatePcampusEmail(userEmail)) {
      return true;
    }

    // 2. Exception Email list check
    try {
      const docRef = doc(db, "exceptionEmails", userEmail.toLowerCase());
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (err) {
      console.error("Error reading exceptions list:", err);
      return false;
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const targetEmail = email.trim().toLowerCase();

    try {
      // Validate access
      const hasAccess = await validateAccess(targetEmail);
      if (!hasAccess) {
        throw new Error(
          "Unrecognized credentials. Only Pulchowk Campus BCT students (rolls 001-048) or approved exception addresses are authorized to access."
        );
      }

      if (isRegister) {
        // Create user
        const credential = await createUserWithEmailAndPassword(auth, targetEmail, password);
        const user = credential.user;

        try {
          await sendEmailVerification(user);
        } catch (verifErr) {
          console.error("Failed to send verification email:", verifErr);
        }

        // IMPORTANT: we deliberately do NOT create the "users" or "roles"
        // Firestore documents here anymore. Doing so at signup meant every
        // unverified account showed up immediately in the Profiles roster
        // for everyone else, since ProfilesView fetches the whole "users"
        // collection with no verification filter.
        //
        // Instead, those documents get created the first time this person
        // logs in AFTER verifying (see fetchProfileAndRole in App.tsx,
        // which only runs once isVerified is true). Until then, this
        // account simply doesn't exist anywhere visible.

        // IMPORTANT: we do NOT sign out here. Firebase already signed this
        // account in the instant it was created — App.tsx's onAuthStateChanged
        // listener is the single gate that decides what to show a signed-in-
        // but-unverified user (its own blank "Verify your email" screen).
        // Signing out here used to race against that: App.tsx would show its
        // verify screen for a split second, then this signOut() would flip
        // it back to the login form. Just let onSuccess() hand off — App.tsx
        // takes it from here.
        onSuccess();
        return;
      } else {
        // Log in. Verification is no longer checked/enforced here —
        // App.tsx's onAuthStateChanged listener is the single gate that
        // decides portal vs. blank verify screen. Checking it here too
        // caused a race: this signOut() would fire a split second AFTER
        // App.tsx had already rendered the portal for the briefly-valid
        // session, causing the flash you saw.
        await signInWithEmailAndPassword(auth, targetEmail, password);
      }
      onSuccess();
    } catch (err: any) {
      console.error("Auth error:", err);
      let errMsg = err.message || "An authentication error occurred.";
      if (err.code === "auth/email-already-in-use") {
        errMsg = "This email is already registered. Please sign in instead.";
      } else if (err.code === "auth/invalid-credential") {
        errMsg = "Invalid email or password combination.";
      } else if (err.code === "auth/weak-password") {
        errMsg = "Password must be at least 6 characters long.";
      } else if (err.code === "auth/operation-not-allowed") {
        errMsg = "Email/Password sign-in is not enabled in Firebase. Please enable 'Email/Password' in the Firebase Auth console.";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // NEW: resend the verification link for whoever the last blocked
  // sign-in/sign-up attempt belonged to.
  const handleResendVerification = async () => {
    if (!pendingUser) return;
    setLoading(true);
    setError("");
    try {
      await sendEmailVerification(pendingUser);
      setSuccessMsg("Verification email resent. Check your inbox and spam folder.");
    } catch (err: any) {
      console.error("Resend verification error:", err);
      setError("Couldn't resend the email right now. Try again in a minute.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    const targetEmail = email.trim().toLowerCase();

    if (!targetEmail) {
      setError("Please enter your official email address first.");
      setLoading(false);
      return;
    }

    try {
      const hasAccess = await validateAccess(targetEmail);
      if (!hasAccess) {
        throw new Error(
          "Access denied. Only registered exception addresses or BCT Pulchowk Campus emails (rolls 001-048) are allowed."
        );
      }

      await sendPasswordResetEmail(auth, targetEmail);
      setSuccessMsg("Password reset link sent! Check your email inbox & spam folder.");
    } catch (err: any) {
      console.error("Password reset error:", err);
      let errMsg = err.message || "An error occurred while sending password reset email.";
      if (err.code === "auth/user-not-found") {
        errMsg = "No account found with this email address.";
      } else if (err.code === "auth/invalid-email") {
        errMsg = "Please enter a valid official email address.";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError("");
    setLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userEmail = user.email || "";

      const hasAccess = await validateAccess(userEmail);
      if (!hasAccess) {
        // Log them out immediately if domain check fails
        await signOut(auth);
        throw new Error(
          "Access denied. Only registered exception addresses or BCT Pulchowk Campus emails (rolls 001-048) are allowed."
        );
      }

      // NOTE: verification is intentionally NOT checked here anymore —
      // App.tsx's onAuthStateChanged listener is the single gate.
      // Google accounts are verified by Google already in nearly all
      // cases; App.tsx will show the blank verify screen for the rare
      // edge case where it isn't, with no race/flash.

      // Check if profile exists; if not, initialize — but only for
      // verified accounts, for the same reason as the register flow above.
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists() && user.emailVerified) {
        const parsed = parsePcampusEmail(userEmail);
        const studentName = user.displayName || parsed?.name || "BCT Student";
        const rollNumber = parsed?.rollNumber || "";
        const batchYear = parsed?.batchYear || "";

        await setDoc(userRef, {
          uid: user.uid,
          name: studentName,
          email: userEmail,
          skills: [],
          socials: {},
          rollNumber,
          batchYear,
          photoURL: user.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.uid}`,
          createdAt: new Date(),
        });

        const role = userEmail === "082bct013.apil@pcampus.edu.np" ? "admin" : "student";
        await setDoc(doc(db, "roles", user.uid), {
          uid: user.uid,
          email: userEmail,
          role,
          grantedBy: "system",
          grantedAt: new Date(),
        });
      }

      onSuccess();
    } catch (err: any) {
      console.error("Google Auth error:", err);
      let errMsg = err.message || "Failed to sign in with Google.";
      if (err.code === "auth/popup-closed-by-user") {
        errMsg = "Google Sign-In popup was closed before completing. Please try again.";
      } else if (err.code === "auth/operation-not-allowed") {
        errMsg = "Google Sign-In is not enabled in Firebase. Please enable 'Google' provider in the Firebase Auth console.";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md border border-[#E5E5E5] hover:border-[#111111] p-8 bg-white transition-all duration-300">

        {/* Brand Banner */}
        <div className="text-center mb-8 border-b border-[#E5E5E5] pb-6">
          <div className="inline-block bg-[#111111] text-[#F4C430] text-[10px] font-sans font-extrabold uppercase tracking-[0.2em] px-3 py-1.5 mb-3">
            PULCHOWK BCT
          </div>
          <h2 className="text-3xl font-serif font-bold text-[#111111] leading-none">
            Class Portal Auth
          </h2>
          <p className="text-sm italic text-[#8A8A8A] mt-2">
            Secure workspace and directory gate
          </p>
        </div>

        {error && (
          <div className="border border-red-500 bg-red-50 text-red-700 p-4 mb-6 text-xs font-sans uppercase tracking-wide leading-relaxed flex items-start gap-2">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">{error}</p>
              {/* NEW: resend button appears whenever we have a blocked, unverified user on hand */}
              {pendingUser && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={loading}
                  className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest underline hover:no-underline disabled:opacity-50"
                >
                  <MailCheck className="w-3 h-3" />
                  Resend verification email
                </button>
              )}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="border border-green-500 bg-green-50 text-green-800 p-4 mb-6 text-xs font-sans uppercase tracking-wide leading-relaxed">
            <p className="font-bold">{successMsg}</p>
            {pendingUser && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={loading}
                className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest underline hover:no-underline disabled:opacity-50"
              >
                <MailCheck className="w-3 h-3" />
                Resend verification email
              </button>
            )}
          </div>
        )}

        {isReset ? (
          /* Password Reset Form */
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <label className="block text-[9px] uppercase font-bold tracking-widest mb-1 text-[#8A8A8A] font-sans">
                Official Email Address
              </label>
              <div className="relative font-sans">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-[#8A8A8A]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="082bct013.apil@pcampus.edu.np"
                  className="w-full pl-9 pr-3 py-2.5 border border-[#E5E5E5] bg-[#F9F9F9] focus:bg-white text-xs outline-none focus:border-[#111111] transition-all"
                />
              </div>
              <span className="text-[9px] text-[#8A8A8A] font-sans block mt-1 uppercase tracking-wider">
                We'll send a password recovery link to your official email.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#111111] text-[#F4C430] hover:bg-[#F4C430] hover:text-[#111111] py-3 text-xs font-sans font-bold uppercase tracking-widest transition-all rounded-[2px] disabled:opacity-50"
            >
              {loading ? "Sending Link..." : "Send Reset Link"}
            </button>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsReset(false);
                  setError("");
                  setSuccessMsg("");
                }}
                className="text-[10px] text-[#8A8A8A] font-sans uppercase font-bold tracking-widest hover:text-[#111111] transition-all hover:underline"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        ) : (
          /* Email & Password Form */
          <>
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-[9px] uppercase font-bold tracking-widest mb-1 text-[#8A8A8A] font-sans">
                    Full Name
                  </label>
                  <div className="relative font-sans">
                    <UserIcon className="absolute left-3 top-3 w-4 h-4 text-[#8A8A8A]" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Apil Sharma"
                      className="w-full pl-9 pr-3 py-2.5 border border-[#E5E5E5] bg-[#F9F9F9] focus:bg-white text-xs outline-none focus:border-[#111111] transition-all uppercase tracking-wider"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[9px] uppercase font-bold tracking-widest mb-1 text-[#8A8A8A] font-sans">
                  Official Email Address
                </label>
                <div className="relative font-sans">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-[#8A8A8A]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="082bct013.apil@pcampus.edu.np"
                    className="w-full pl-9 pr-3 py-2.5 border border-[#E5E5E5] bg-[#F9F9F9] focus:bg-white text-xs outline-none focus:border-[#111111] transition-all"
                  />
                </div>
                <span className="text-[9px] text-[#8A8A8A] font-sans block mt-1 uppercase tracking-wider">
                  Format: {'{batch}bct{roll}.{name}@pcampus.edu.np'} (Rolls: 001–048)
                </span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[9px] uppercase font-bold tracking-widest text-[#8A8A8A] font-sans">
                    Access Password
                  </label>
                  {!isRegister && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsReset(true);
                        setError("");
                        setSuccessMsg("");
                      }}
                      className="text-[9px] text-[#8A8A8A] uppercase font-bold tracking-widest hover:text-[#111111] transition-all hover:underline"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative font-sans">
                  <Key className="absolute left-3 top-3 w-4 h-4 text-[#8A8A8A]" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 border border-[#E5E5E5] bg-[#F9F9F9] focus:bg-white text-xs outline-none focus:border-[#111111] transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#111111] text-[#F4C430] hover:bg-[#F4C430] hover:text-[#111111] py-3 text-xs font-sans font-bold uppercase tracking-widest transition-all rounded-[2px] disabled:opacity-50"
              >
                {loading ? "Verifying Credentials..." : isRegister ? "Sign Up & Register" : "Login to Portal"}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex py-5 items-center">
              <div className="flex-grow border-t border-[#E5E5E5]"></div>
              <span className="flex-shrink mx-4 text-[9px] text-[#8A8A8A] uppercase font-bold tracking-widest font-sans">
                Or Use
              </span>
              <div className="flex-grow border-t border-[#E5E5E5]"></div>
            </div>

            {/* Google Quick Sign in */}
            <button
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full bg-white text-[#111111] border border-[#E5E5E5] hover:border-[#111111] py-2.5 text-xs font-sans font-bold uppercase tracking-widest hover:bg-[#F9F9F9] transition-all flex items-center justify-center gap-2 rounded-[2px]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.16-3.16C17.43 1.68 14.9 1 12 1 7.35 1 3.39 3.65 1.5 7.5l3.61 2.8C6.01 7.02 8.78 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.61 2.8c2.11-1.95 3.82-5.32 3.82-8.53z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.11 14.7c-.24-.73-.38-1.52-.38-2.33s.14-1.6.38-2.33L1.5 7.24C.54 9.12 0 11.24 0 13.5s.54 4.38 1.5 6.26l3.61-2.8z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.97-1.08 7.96-2.91l-3.61-2.8c-1.11.75-2.52 1.2-4.35 1.2-3.22 0-5.99-1.98-6.89-5.26l-3.61 2.8C3.39 20.35 7.35 23 12 23z"
                />
              </svg>
              Sign In with Campus Google
            </button>

            {/* Toggle Mode */}
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError("");
                  setSuccessMsg("");
                  setPendingUser(null);
                }}
                className="text-[10px] text-[#8A8A8A] font-sans uppercase font-bold tracking-widest hover:text-[#111111] transition-all hover:underline"
              >
                {isRegister
                  ? "Already have an account? Sign In"
                  : "New BCT Student? Register/Sign Up here"}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}