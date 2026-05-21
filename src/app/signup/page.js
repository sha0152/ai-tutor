"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function signUp() {
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      alert("Account created. Please sign in.");
      window.location.href = "/signin";
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

        <div className="text-xl text-center">Sign Up</div>

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
          onClick={signUp}
          disabled={loading}
          className="
            w-full p-2 rounded-xl
            bg-white/10 border border-white/10
            backdrop-blur-xl
            hover:bg-green-500/30 hover:border-green-400/40
            transition-all duration-200
          "
        >
          {loading ? "Loading..." : "Create Account"}
        </button>

        <p
          className="text-sm text-center opacity-60 cursor-pointer hover:opacity-100"
          onClick={() => (window.location.href = "/signin")}
        >
          Already have an account? Sign in
        </p>

      </div>
    </div>
  );
}