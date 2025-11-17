import { createError, eventHandler } from 'h3'
import {
  getGarminConfig,
  generateCodeVerifier,
  generateCodeChallenge,
  createGarminOAuth2State,
  GARMIN_AUTHORIZE_URL,
} from '../../utils/garmin'

export default eventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) {
    throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })
  }

  const { clientId, redirectUri } = getGarminConfig()

  // PKCE: Code Verifier und Challenge generieren
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = generateCodeChallenge(codeVerifier)

  // State für OAuth generieren
  const state = await createGarminOAuth2State(auth.user.id, codeVerifier)

  // OAuth2 Authorization URL erstellen
  const authorizeUrl = new URL(GARMIN_AUTHORIZE_URL)
  authorizeUrl.searchParams.set('client_id', clientId)
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('code_challenge', codeChallenge)
  authorizeUrl.searchParams.set('code_challenge_method', 'S256')
  authorizeUrl.searchParams.set('redirect_uri', redirectUri)
  authorizeUrl.searchParams.set('state', state)

  return {
    url: authorizeUrl.toString(),
  }
})

