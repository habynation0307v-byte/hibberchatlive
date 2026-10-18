export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/chat" && request.method === "POST") {
      if (!env.AI) return Response.json({ error: "AI binding is not configured." }, { status: 503 });
      let body;
      try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON." }, { status: 400 }); }
      const incoming = Array.isArray(body.messages) ? body.messages : [];
      const messages = incoming
        .filter(m => m && ["user", "assistant"].includes(m.role) && typeof m.content === "string")
        .slice(-12)
        .map(m => ({ role: m.role, content: m.content.slice(0, 1000) }));
      if (!messages.length || messages[messages.length - 1].role !== "user") {
        return Response.json({ error: "Please send a message." }, { status: 400 });
      }
      const system = `You are Hibber AI Assistant on HibberChatLive, a third-party informational website. Be friendly, concise, and helpful in English. Always be transparent that you are an AI, never pretend to be a real person or a romantic partner. You may explain online referral programmes and general online safety. If asked about Moxera, do not invent facts, fees, payouts, legitimacy claims, or guaranteed earnings; say the visitor should verify current terms directly with Moxera. Never pressure anyone to register, pay, or recruit others. Do not claim that income is guaranteed.`;
      try {
        const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
          messages: [{ role: "system", content: system }, ...messages],
          max_tokens: 350
        });
        const reply = result?.response || result?.choices?.[0]?.message?.content || "Sorry, I couldn't generate a reply.";
        return Response.json({ reply }, { headers: { "Cache-Control": "no-store" } });
      } catch {
        return Response.json({ error: "AI request failed. Please try again." }, { status: 502 });
      }
    }
    return env.ASSETS.fetch(request);
  }
};