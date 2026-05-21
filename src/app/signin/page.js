"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          window.location.href = "/";
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signIn() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data?.user) {
      window.location.href = "/";
    }

    setLoading(false);
  }

  return (
    <div className="h-screen flex items-center justify-center bg-black text-white">
      <div className="
        w-[340px] p-6 rounded-2xl
        bg-white/10 backdrop-blur-xl
        border border-white/10 space-y-3
      ">

        <div className="text-xl text-center">Sign In</div>

        <input
          className="w-full p-2 rounded-xl bg-white/10 border border-white/10 backdrop-blur-xl"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full p-2 rounded-xl bg-white/10 border border-white/10 backdrop-blur-xl"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <div className="text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <button
          onClick={signIn}
          disabled={loading}
          className="
            w-full p-2 rounded-xl
            bg-white/10 border border-white/10
            backdrop-blur-xl
            hover:bg-blue-500/30 hover:border-blue-400/40
            transition-all duration-200
          "
        >
          {loading ? "Loading..." : "Sign In"}
        </button>

        <p
          className="text-sm text-center opacity-60 cursor-pointer hover:opacity-100"
          onClick={() => (window.location.href = "/signup")}
        >
          Need an account? Sign up
        </p>

      </div>
    </div>
  );
}