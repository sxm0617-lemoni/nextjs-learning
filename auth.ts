import { sql } from '@vercel/postgres'
import bcrypt from 'bcrypt'
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'
import { User } from './app/lib/definitions'
import { authConfig } from './auth.config'

async function getUser(email: string): Promise<User | undefined> {
  try {
    const users = await sql<User>`
      SELECT * FROM users
      WHERE email=${email}
    `
    return users.rows[0]
  } catch (error) {
    console.error('Failed to get user:', error)
    throw new Error('Failed to fetch user')
  }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials)

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data
          const user = await getUser(email)
          if (!user) {
            return null
          }

          console.log(38, user)

          const passwordsMatch = await bcrypt.compare(
            String(password),
            String(user.password)
          )
          if (passwordsMatch) {
            return user
          }
        }

        console.log('Invalid credentials')
        return null
      },
    }),
  ],
})
