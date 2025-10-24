import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      username?: string | null;
      image?: string | null;
      needsOnboarding?: boolean;
      sessionToken?: string;
    }
  }
  
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    username?: string | null;
    image?: string | null;
    needsOnboarding?: boolean;
    sessionToken?: string;
  }
}

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
          
          const response = await fetch(`${backendUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const data = await response.json();

          if (response.ok && data.success && data.user && data.sessionToken) {
            // Store the session token for later use
            return {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              username: data.user.username,
              image: data.user.image,
              needsOnboarding: data.needsOnboarding || false,
              sessionToken: data.sessionToken, // Pass the session token
            };
          }

          return null;
        } catch (error) {
          console.error('Credentials authorization error:', error);
          return null;
        }
      }
    }),
  ],
  session: {
    strategy: "database",
  },
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Skip backend call for credentials provider as it's already authenticated
        if (account?.provider === "credentials") {
          return true;
        }

        // Handle Google OAuth
        if (account?.provider === "google") {
          if (!process.env.NEXT_PUBLIC_API_URL) {
            console.error('NEXT_PUBLIC_API_URL is not defined');
            return false;
          }

          console.log('Making backend call for Google OAuth...');

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
            console.error('Backend error response:', data);
            return false;
          }

          // Update user object with data from backend
          if (data.success && data.user) {
            user.id = data.user.id;
            user.username = data.user.username;
            user.needsOnboarding = data.needsOnboarding;
            
            // Store session token in user object for later use
            if (data.sessionToken) {
              user.sessionToken = data.sessionToken;
            }
          }

          return true;
        }

        return true;
      } catch (error) {
        console.error('NextAuth signIn callback error:', error);
        return false;
      }
    },
    async session({ session, user }) {
      // With database sessions, we use the user from database
      try {
        if (session?.user && user) {
          session.user.id = user.id;
          session.user.username = user.username;
          
          // Check if user needs onboarding by verifying username format
          const needsOnboarding = !user.username || user.username.includes('temp_') || user.username.length < 3;
          session.user.needsOnboarding = needsOnboarding;
          console.log(user)
          // If session token exists in user object, make it available
          if (user.sessionToken) {
            session.user.sessionToken = user.sessionToken;
          }
        }
        return session;
      } catch (error) {
        console.error('NextAuth session callback error:', error);
        return session;
      }
    },
    async redirect({ url, baseUrl }) {
      // If the user needs onboarding, redirect them to the onboarding page
      if (url.startsWith(baseUrl)) {
        const urlObj = new URL(url);
        if (urlObj.searchParams.get('error') === 'AccessDenied') {
          return `${baseUrl}/login?error=AccessDenied`;
        }
        
        // Check if user needs onboarding and redirect appropriately
        if (urlObj.searchParams.get('needsOnboarding') === 'true') {
          return `${baseUrl}/onboarding`;
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
