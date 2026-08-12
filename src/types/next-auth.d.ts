import NextAuth, { DefaultSession, DefaultUser } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'ADMIN' | 'STAFF';
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role?: 'ADMIN' | 'STAFF';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    role?: 'ADMIN' | 'STAFF';
  }
}
