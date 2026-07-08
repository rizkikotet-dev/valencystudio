import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    DiscordProvider({
      clientId: process.env.AUTH_DISCORD_ID!,
      clientSecret: process.env.AUTH_DISCORD_SECRET!,
      authorization: { params: { scope: "identify email guilds.join" } },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Notify Discord webhook when user logs in (optional)
      const webhook = process.env.DISCORD_LOG_WEBHOOK_URL;
      if (webhook && account?.provider === "discord") {
        fetch(webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
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
          }),
        }).catch(() => {});
      }
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
