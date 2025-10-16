
import { defineEventHandler, getCookie, setCookie } from 'h3'
import { randomUUID } from 'crypto'

export default defineEventHandler((event) => {
  let token = getCookie(event, 'csrf_token')
  if (!token) {
    token = randomUUID()
    setCookie(event, 'csrf_token', token, {
      httpOnly: false,            
      sameSite: 'lax',              
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,  
    })
  }
})
