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

  interface JWT {
    id?: string;
    sessionToken?: string;
    username?: string;
    needsOnboarding?: boolean;
    email?: string;
    name?: string;
    image?: string;
  }
}

const handler = NextAuth({
  // Remove PrismaAdapter when using JWT sessions to avoid conflicts
  // adapter: PrismaAdapter(prisma),
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
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async jwt({ token, user, account }) {
      
      // Store user data in the JWT token when user signs in
      if (user) {
        // Store all user data in token
        token.id = user.id;
        token.username = user.username;
        token.needsOnboarding = user.needsOnboarding;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
        
        // Store the sessionToken in the JWT token when user signs in
        if (user.sessionToken) {
          token.sessionToken = user.sessionToken;
        } else {
          console.log('JWT callback - No sessionToken found in user object');
        }
      }
      return token;
    },
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
            // Important: Mutate the user object directly for JWT strategy
            user.id = data.user.id;
            user.username = data.user.username;
            user.needsOnboarding = data.needsOnboarding;
            user.email = data.user.email || user.email;
            user.name = data.user.name || user.name;
            
            // Store session token in user object for later use
            if (data.sessionToken) {
              user.sessionToken = data.sessionToken;
            } else {
              console.log('SignIn callback - No sessionToken received from backend');
            }
            
          } else {
            console.log('SignIn callback - Backend response missing user data or sessionToken');
          }

          return true;
        }

        return true;
      } catch (error) {
        console.error('NextAuth signIn callback error:', error);
        return false;
      }
    },
    async session({ session, token }) {
      
      // With JWT sessions, we use the token data
      try {
        if (session?.user && token) {
          // Use token data to populate session
          session.user.id = (token.id as string) || (token.sub as string);
          session.user.email = (token.email as string) || session.user.email;
          session.user.name = (token.name as string) || session.user.name;
          session.user.image = (token.image as string) || session.user.image;
          session.user.username = token.username as string;
          session.user.needsOnboarding = token.needsOnboarding as boolean;
          
          // Get sessionToken from JWT token
          if (token.sessionToken) {
            session.user.sessionToken = token.sessionToken as string;
          } else {
            console.log('Session callback - No sessionToken found in JWT token');
          }
        }
        return session;
      } catch (error) {
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
