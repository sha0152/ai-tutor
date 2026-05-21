"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import katex from "katex";
import "katex/dist/katex.min.css";
import { marked } from "marked";

export default function Home() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [puterReady, setPuterReady] = useState(false);

  const chatRef = useRef(null);

  // ---------------- AUTH ----------------
  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user ?? null);
      setAuthReady(true);
    }

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setAuthReady(true);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady) return;

    if (!user) {
      window.location.href = "/signin";
    }
  }, [user, authReady]);

  // ---------------- LOAD CHAT HISTORY ----------------
  useEffect(() => {
    if (!user) return;

    async function loadMessages() {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error(error);
        return;
      }

      const formatted = data.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      setChat(formatted);
    }

    loadMessages();
  }, [user]);

  // ---------------- LOAD PUTER ----------------
  useEffect(() => {
    const script = document.createElement("script");

    script.src = "https://js.puter.com/v2/";
    script.async = true;

    script.onload = () => {
      setTimeout(() => {
        if (window.puter?.ai?.chat) {
          setPuterReady(true);
        }
      }, 500);
    };

    document.body.appendChild(script);
  }, []);

  // ---------------- AUTO SCROLL ----------------
  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chat, loading]);

  // ---------------- CLEAN AI OUTPUT ----------------
  function cleanAI(text) {
  if (!text) return "";

  return text
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

  // ---------------- RENDER CONTENT ----------------
  function renderContent(text) {
    if (!text) return "";

    let cleaned = cleanAI(text);

    let html = marked.parse(cleaned);

    // block math
    html = html.replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) => {
      try {
        return katex.renderToString(expr.trim(), {
          displayMode: true,
          throwOnError: false,
          strict: false,
        });
      } catch {
        return `$$${expr}$$`;
      }
    });

    // inline math
    html = html.replace(/\$([^\$]+?)\$/g, (_, expr) => {
      try {
        return katex.renderToString(expr.trim(), {
          displayMode: false,
          throwOnError: false,
          strict: false,
        });
      } catch {
        return `$${expr}$`;
      }
    });

    return html;
  }

  // ---------------- CLEAR MEMORY ----------------
  async function clearMemory() {
    if (!user) return;

    await supabase
      .from("messages")
      .delete()
      .eq("user_id", user.id);

    setChat([]);
  }

  // ---------------- SEND ----------------
  async function sendMessage() {
    if (!message.trim() || loading) return;

    if (!puterReady || !window.puter?.ai?.chat) {
      alert("AI still loading...");
      return;
    }

    const userMessage = {
      role: "user",
      content: message,
    };

    const newChat = [...chat, userMessage];

    setChat(newChat);
    setMessage("");
    setLoading(true);

    // SAVE USER MESSAGE
    await supabase.from("messages").insert({
      user_id: user.id,
      role: "user",
      content: message,
    });

    try {
      // recent memory for AI
      const memory = newChat.slice(-20);

      const res = await window.puter.ai.chat(
        [
          {
            role: "system",
            content: `
You are a premium AI tutor.

IMPORTANT:
ALL mathematics MUST use proper LaTeX delimiters.

INLINE math:
$x^2$

BLOCK math:
$$
x^2+3x+1
$$

NEVER use:
- [ ... ]
- \\( ... \\)
- malformed LaTeX
- partial math syntax
- HTML tags
- mixed formatting

STYLE:
- Sound natural and human
- Avoid robotic outlines
- Use clean markdown
- Keep spacing generous
- Keep explanations short and readable
- Use headings only when useful
- Use bold text sparingly
- Never create giant walls of text

MATH STYLE:
- Every equation MUST be wrapped correctly
- Never leave loose symbols outside LaTeX

QUESTION STYLE:
- Let the student think
- Give hints before answers
- Explain mistakes gently
- Keep learning interactive

GENERAL:
- Teach any subject naturally
- Prioritize readability
- Make lessons feel modern and premium
`,
          },

          ...memory,
        ],
        {
          model: "google/gemini-3.1-flash-lite",
        }
      );

      const aiText =
        res?.message?.content || "No response.";

      const aiMessage = {
        role: "assistant",
        content: aiText,
      };

      setChat([...newChat, aiMessage]);

      // SAVE AI MESSAGE
      await supabase.from("messages").insert({
        user_id: user.id,
        role: "assistant",
        content: aiText,
      });
    } catch (err) {
      console.error(err);

      setChat([
        ...newChat,
        {
          role: "assistant",
          content: "Something went wrong.",
        },
      ]);
    }

    setLoading(false);
  }

  // ---------------- UI ----------------
  return (
    <div
      className="
        h-screen flex flex-col
        bg-gradient-to-br
        from-[#050816]
        via-[#0b1220]
        to-[#111827]
        text-white
        p-4
      "
    >
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <div
            className="
              text-3xl font-bold
              bg-gradient-to-r
              from-cyan-300
              via-blue-300
              to-indigo-300
              bg-clip-text
              text-transparent
            "
          >
            TutorAI
          </div>

          <div className="text-sm text-white/40 mt-1">
            Premium AI learning assistant
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={clearMemory}
            className="
              px-5 py-2.5 rounded-2xl
              bg-red-500/10
              hover:bg-red-500/20
              border border-red-400/20
              backdrop-blur-xl
              transition-all duration-300
            "
          >
            Clear Memory
          </button>

          <button
            onClick={() => supabase.auth.signOut()}
            className="
              px-5 py-2.5 rounded-2xl
              bg-white/10
              hover:bg-white/15
              border border-white/10
              backdrop-blur-xl
              transition-all duration-300
            "
          >
            Logout
          </button>
        </div>
      </div>

      {/* LOADING */}
      {!puterReady && (
        <div className="text-cyan-300 mb-3 animate-pulse">
          Loading AI...
        </div>
      )}

      {/* CHAT */}
      <div
        ref={chatRef}
        className="
          flex-1 overflow-y-auto
          rounded-[34px]
          border border-white/10
          bg-white/[0.04]
          backdrop-blur-3xl
          p-5
          shadow-2xl
        "
      >
        {chat.map((c, i) => (
          <div
            key={i}
            className={`
              mb-5 p-6 rounded-[30px]
              border border-white/10
              backdrop-blur-2xl
              transition-all duration-300
              shadow-lg

              ${
                c.role === "user"
                  ? `
                    ml-12
                    bg-gradient-to-br
                    from-cyan-500/20
                    to-blue-500/20
                  `
                  : `
                    mr-12
                    bg-white/[0.06]
                  `
              }
            `}
          >
            <div
              className="
                prose prose-invert max-w-none

                prose-headings:font-bold
                prose-headings:text-white

                prose-h1:text-4xl
                prose-h2:text-3xl
                prose-h3:text-2xl

                prose-p:text-white/90
                prose-p:leading-8
                prose-p:text-[16px]

                prose-strong:text-cyan-300

                prose-li:text-white/85
                prose-li:marker:text-cyan-400

                prose-code:text-cyan-300

                prose-hr:border-white/10
              "
              dangerouslySetInnerHTML={{
                __html: renderContent(c.content),
              }}
            />
          </div>
        ))}

        {loading && (
          <div className="text-cyan-300 animate-pulse">
            Thinking...
          </div>
        )}
      </div>

      {/* INPUT */}
      <div className="flex gap-3 mt-4">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
          placeholder="Ask anything..."
          className="
            flex-1
            p-4
            rounded-3xl

            bg-white/10
            border border-white/10

            backdrop-blur-2xl

            outline-none

            text-white
            placeholder:text-white/35

            focus:border-cyan-400
            focus:bg-white/15

            transition-all duration-300
          "
        />

        <button
          onClick={sendMessage}
          className="
            px-7 py-4
            rounded-3xl

            bg-gradient-to-r
            from-cyan-500
            to-blue-500

            hover:scale-[1.03]
            active:scale-[0.98]

            transition-all duration-300

            font-semibold
            shadow-xl
          "
        >
          Send
        </button>
      </div>
    </div>
  );
}