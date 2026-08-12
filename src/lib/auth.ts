import { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from './db';

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email || !account) return false;
      
      const googleId = profile?.sub || account.providerAccountId;
      if (!googleId) return false;

      try {
        await prisma.user.upsert({
          where: { googleSubjectId: googleId },
          update: {
            displayName: user.name || user.email.split('@')[0],
            avatarUrl: user.image || null,
            email: user.email,
          },
          create: {
            googleSubjectId: googleId,
            email: user.email,
            displayName: user.name || user.email.split('@')[0],
            avatarUrl: user.image || null,
          },
        });
        return true;
      } catch (error) {
        console.error('Error saving user during sign-in:', error);
        return false;
      }
    },
    async jwt({ token }) {
      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
        });

        if (dbUser) {
          token.userId = dbUser.id;
        }

        const adminEmails = (process.env.ADMIN_EMAILS || '')
          .split(',')
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean);

        const isUserAdmin = adminEmails.includes(token.email.toLowerCase());
        token.role = isUserAdmin ? 'ADMIN' : 'STAFF';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role as 'ADMIN' | 'STAFF';
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};
