import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

const BOT_TOKEN = process.env.BOT_TOKEN;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

async function notifyLogin(user: any, account: any) {
  if (!BOT_TOKEN || !LOG_CHANNEL_ID || account?.provider !== "discord") {
    console.log("[auth] ⏭️ notifyLogin skipped:", { hasToken: !!BOT_TOKEN, hasChannel: !!LOG_CHANNEL_ID, provider: account?.provider });
    return;
  }
  try {
    const body = {
      embeds: [{
        title: "🔑 User Login",
        description: `<@${account.providerAccountId}> **${user.name}**`,
        fields: [
          { name: "Discord ID", value: account.providerAccountId, inline: true },
          { name: "Email", value: user.email || "N/A", inline: true },
        ],
        thumbnail: { url: user.image || "" },
        color: 0x5865f2,
        timestamp: new Date().toISOString(),
      }],
    };
    const res = await fetch(`https://discord.com/api/v10/channels/${LOG_CHANNEL_ID}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bot ${BOT_TOKEN}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[auth] ❌ Discord API ${res.status}:`, errText);
    } else {
      console.log(`[auth] ✅ Login log sent for ${user.name}`);
    }
  } catch (e) {
    console.error("[auth] ❌ notifyLogin error:", e);
  }
}

const handler = NextAuth({
  providers: [
    DiscordProvider({
      clientId: process.env.AUTH_DISCORD_ID!,
      clientSecret: process.env.AUTH_DISCORD_SECRET!,
      authorization: { params: { scope: "identify email guilds.join" } },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      await notifyLogin(user, account);
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
});

export const GET = handler;
export const POST = handler;
export const { auth } = handler;
export const { signIn, signOut } = handler;
