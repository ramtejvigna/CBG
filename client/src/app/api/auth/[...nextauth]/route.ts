import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      username?: string | null;
      image?: string | null;
      needsOnboarding?: boolean;
    }
  }
  
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    username?: string | null;
    image?: string | null;
    needsOnboarding?: boolean;
  }
}

const handler = NextAuth({
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

          if (response.ok && data.success && data.user) {
            return {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              username: data.user.username,
              image: data.user.image,
              needsOnboarding: data.needsOnboarding || false,
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
        }

        return true;
      } catch (error) {
        console.error('Error storing user data:', error);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.needsOnboarding = user.needsOnboarding;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.needsOnboarding = token.needsOnboarding as boolean;
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
