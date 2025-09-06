import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      needsOnboarding?: boolean;
    }
  }
  
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    needsOnboarding?: boolean;
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (!process.env.NEXT_PUBLIC_API_URL) {
          console.error('NEXT_PUBLIC_API_URL is not defined');
          throw new Error('Server configuration error');
        }

        // Make API call to your backend to store/update user data
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            image: user.image,
            googleId: profile?.sub,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error('Server response:', data);
          throw new Error(data.message || 'Failed to store user data');
        }

        // If onboarding is needed, we still return true but store this info in the token
        if (data.needsOnboarding) {
          user.needsOnboarding = true;
        }

        return true;
      } catch (error) {
        console.error('Error storing user data:', error);
        return false;
      }
    },
    async session({ session, user }) {
      if (session?.user) {
        session.user.id = user.id;
        session.user.needsOnboarding = user.needsOnboarding;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If the user needs onboarding, redirect them to the onboarding page
      if (url.startsWith(baseUrl)) {
        const urlObj = new URL(url);
        if (urlObj.searchParams.get('error') === 'AccessDenied') {
          return `${baseUrl}/login?error=AccessDenied`;
        }
      }
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
  pages: {
    signIn: '/login',
  },
});

export { handler as GET, handler as POST };
