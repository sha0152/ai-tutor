"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const chatRef = useRef(null);

  // LOAD PUTER
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.puter.com/v2/";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // AUTH CHECK
  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
        setMode("app");
      }
    }

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(event);

      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        setMode("app");
      }

      if (event === "SIGNED_OUT") {
        setUser(null);
        setMode("login");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // AUTO SCROLL
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chat, loading]);

  // SIGN UP
  async function signUp() {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      console.log("SIGNUP:", data, error);

      if (error) {
        alert(error.message);
        return;
      }

      alert("Account created! Please login.");
    } catch (err) {
      console.log(err);
      alert("Signup failed");
    }
  }

  // LOGIN
  async function signIn() {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      console.log("LOGIN:", data, error);

      if (error) {
        alert(error.message);
        return;
      }

      if (data?.user) {
        setUser(data.user);
        setMode("app");
      }
    } catch (err) {
      console.log(err);
      alert("Login failed");
    }
  }

  // LOGOUT
  async function logout() {
    await supabase.auth.signOut();

    setUser(null);
    setChat([]);
    setMode("login");
  }

  // SEND MESSAGE
  async function sendMessage() {
    if (!message.trim() || loading) return;

    const newChat = [...chat, { role: "user", content: message }];

    setChat(newChat);
    setMessage("");
    setLoading(true);

    try {
      if (!window.puter?.ai?.chat) {
        throw new Error("AI not loaded");
      }

      const response = await window.puter.ai.chat(
        [
          {
            role: "system",
            content: `
You are a real private tutor helping a student 1-on-1.

IMPORTANT RULES:
- NEVER use markdown
- NEVER use headings
- NEVER use bullet points
- NEVER use numbered lists unless absolutely needed
- Talk naturally like a real tutor texting a student
- Keep replies short and conversational
- Teach only ONE concept at a time
- Avoid giant explanations
- Ask only ONE follow-up question at the end
- Use simple language
- Encourage the student naturally
- Do not dump information all at once
- Format math naturally in plain text

Your goal is to feel like a real human tutor, not ChatGPT.
            `,
          },
          ...newChat,
        ],
        {
          model: "openai/gpt-5.4-nano",
        }
      );

      const finalChat = [
        ...newChat,
        {
          role: "assistant",
          content:
            response?.message?.content ||
            "Sorry, I couldn't respond.",
        },
      ];

      setChat(finalChat);
    } catch (err) {
      console.log(err);

      setChat([
        ...newChat,
        {
          role: "assistant",
          content: "Something went wrong. Try again.",
        },
      ]);
    }

    setLoading(false);
  }

  // ================= LOGIN SCREEN =================
  if (mode !== "app") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-black to-zinc-900 text-white p-4">

        <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl">

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight">
              AI Tutor
            </h1>

            <p className="text-zinc-400 mt-2">
              Your personal AI tutor
            </p>
          </div>

          <div className="space-y-4">

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 rounded-2xl bg-white/10 border border-white/10 outline-none focus:border-blue-500 transition"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 rounded-2xl bg-white/10 border border-white/10 outline-none focus:border-blue-500 transition"
            />

            <button
              onClick={signIn}
              className="w-full bg-blue-600 hover:bg-blue-500 transition py-4 rounded-2xl font-semibold active:scale-[0.98]"
            >
              Login
            </button>

            <button
              onClick={signUp}
              className="w-full bg-zinc-800 hover:bg-zinc-700 transition py-4 rounded-2xl font-semibold active:scale-[0.98]"
            >
              Create Account
            </button>

          </div>

        </div>

      </main>
    );
  }

  // ================= APP =================
  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-900 text-white flex items-center justify-center p-4 font-sans">

      <div className="w-full max-w-3xl flex flex-col h-[90vh]">

        {/* HEADER */}
        <div className="text-center mb-4">

          <h1 className="text-4xl font-semibold tracking-tight">
            AI Tutor
          </h1>

          <div className="flex items-center justify-center gap-3 mt-2">

            <p className="text-sm text-zinc-400">
              {user?.email}
            </p>

            <button
              onClick={logout}
              className="text-sm px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition"
            >
              Logout
            </button>

          </div>

        </div>

        {/* CHAT */}
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto rounded-3xl p-5 space-y-4 bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl"
        >

          {chat.length === 0 && (
            <div className="text-zinc-500 text-center mt-10 animate-pulse">
              Ask something like "teach me algebra"
            </div>
          )}

          {chat.map((msg, i) => (
            <div
              key={i}
              className={`flex animate-fadeIn ${
                msg.role === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`px-4 py-3 rounded-2xl max-w-[80%] text-sm leading-relaxed shadow-md whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white/10 text-zinc-100"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* TYPING */}
          {loading && (
            <div className="flex items-center gap-2 text-zinc-400 text-sm animate-pulse">

              <div className="flex gap-1">
                <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce delay-75"></span>
                <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce delay-150"></span>
              </div>

              Tutor is thinking...
            </div>
          )}

        </div>

        {/* INPUT */}
        <div className="mt-4 flex gap-2">

          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask anything to learn..."
            className="flex-1 p-4 rounded-2xl bg-white/10 backdrop-blur-md outline-none border border-white/10 focus:border-blue-500 transition"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) {
                sendMessage();
              }
            }}
          />

          <button
            onClick={() => {
              if (!loading) sendMessage();
            }}
            className={`px-6 rounded-2xl transition-all shadow-lg active:scale-95 ${
              loading
                ? "bg-zinc-600 text-zinc-300 cursor-not-allowed opacity-70"
                : "bg-blue-600 hover:bg-blue-500"
            }`}
          >
            {loading ? "..." : "Send"}
          </button>

        </div>

      </div>

      {/* ANIMATIONS */}
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .delay-75 {
          animation-delay: 0.15s;
        }

        .delay-150 {
          animation-delay: 0.3s;
        }
      `}</style>

    </main>
  );
}