import { SessionOptions, getIronSession } from 'iron-session'
import { cookies } from 'next/headers'

export interface SessionData {
  participantId?: string
  isAdmin?: boolean
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: 'qrquiz_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 8,
  },
}

export const adminSessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: 'qrquiz_admin',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 8,
  },
}

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions)
}

export async function getAdminSession() {
  return getIronSession<SessionData>(await cookies(), adminSessionOptions)
}
