import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { getSupabaseAdmin } from '../../../lib/supabase'
import { sendMetaEvent } from '../../../lib/metaPixel'

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ user, account }) {
      try {
        const { error } = await getSupabaseAdmin()
          .from('users')
          .upsert({
            email: user.email,
            name: user.name,
            image: user.image,
            google_id: account.providerAccountId,
            last_login: new Date().toISOString()
          }, { onConflict: 'email' })

        if (error) throw error

        await sendMetaEvent({
          eventName: 'Lead',
          userEmail: user.email
        })
      } catch (err) {
        console.error('[NextAuth signIn]', err.message)
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) token.email = user.email
      return token
    },
    async session({ session, token }) {
      session.user.email = token.email
      return session
    }
  },
  pages: {
    signIn: '/',
    error: '/'
  },
  secret: process.env.NEXTAUTH_SECRET
}

export default NextAuth(authOptions)
