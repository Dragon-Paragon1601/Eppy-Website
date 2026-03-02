import DiscordProvider from "next-auth/providers/discord";

export const authOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "identify guilds guilds.members.read",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
      }

      if (profile?.id) {
        token.id = profile.id;
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;

      if (session.user) {
        session.user.id = token.id;
      }

      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};
