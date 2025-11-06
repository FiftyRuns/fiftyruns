import { createError, eventHandler } from 'h3'
import { getStravaConfig, createStravaState, STRAVA_AUTHORIZE_URL } from '../../utils/strava'

export default eventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) {
    throw createError({ statusCode: 401, message: 'Nicht angemeldet.' })
  }

  const { clientId, redirectUri, scope } = getStravaConfig()

  const state = await createStravaState(auth.user.id)

  const authorizeUrl = new URL(STRAVA_AUTHORIZE_URL)
  authorizeUrl.searchParams.set('client_id', clientId)
  authorizeUrl.searchParams.set('redirect_uri', redirectUri)
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('approval_prompt', 'auto')
  authorizeUrl.searchParams.set('scope', scope.join(','))
  authorizeUrl.searchParams.set('state', state)

  return {
    url: authorizeUrl.toString(),
  }
})
