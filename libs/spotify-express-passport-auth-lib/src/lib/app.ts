import * as express from 'express'
import * as session from 'express-session'
import * as passport from 'passport'
import { Strategy as SpotifyStrategy } from 'passport-spotify'

export const port = process.env.SPOTIFY_EXPRESS_PASSPORT_PORT || 3333

export function createSpotifyAuthServer(
  clientID: string,
  clientSecret: string,
  scope: string[],
  origin: string,
  basePath = process.env.BASE_PATH ?? ''
) {
  const authCallbackPath = '/auth/spotify/callback'

  const callbackURL = new URL(origin)
  callbackURL.pathname = `${basePath}${authCallbackPath}`

  passport.serializeUser((user, done) => done(null, user))
  passport.deserializeUser((obj, done) => done(null, obj))

  // Use the SpotifyStrategy within Passport.
  //   Strategies in Passport require a `verify` function, which accept
  //   credentials (in this case, an accessToken, refreshToken, expires_in
  //   and spotify profile), and invoke a callback with a user object.
  passport.use(
    // @ts-ignore
    new SpotifyStrategy(
      {
        clientID,
        clientSecret,
        callbackURL: callbackURL.toString(),
      },
      function (accessToken, refreshToken, expiresIn, profile, done) {
        // @ts-ignore
        process.emit('auth:spotify:finished', {
          accessToken,
          refreshToken,
          expiresIn,
          profile,
        })

        // asynchronous verification, for effect...
        process.nextTick(function () {
          // To keep the example simple, the user's spotify profile is returned to
          // represent the logged-in user. In a typical application, you would want
          // to associate the spotify account with a user record in your database,
          // and return that user instead.
          return done(null, profile)
        })
      }
    )
  )

  const app = express()

  app.use(
    session({ secret: 'keyboard cat', resave: true, saveUninitialized: true })
  )
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(passport.initialize())
  app.use(passport.session())

  // GET /auth/spotify
  //   Use passport.authenticate() as route middleware to authenticate the
  //   request. The first step in spotify authentication will involve redirecting
  //   the user to spotify.com. After authorization, spotify will redirect the user
  //   back to this application at /auth/spotify/callback
  app.get('/auth/spotify', passport.authenticate('spotify', { scope }))

  // GET /auth/spotify/callback
  //   Use passport.authenticate() as route middleware to authenticate the
  //   request. If authentication fails, the user will be redirected back to the
  //   login page. Otherwise, the primary route function function will be called,
  //   which, in this example, will redirect the user to the home page.
  app.get(
    authCallbackPath,
    passport.authenticate('spotify', { failureRedirect: '/login' }),
    (req, res) => res.json({ user: req.user })
  )

  app.get('/logout', (req, res) => {
    req.logout()
    res.redirect(`${basePath}/api`)
  })

  app.get('/api', (_, res) => {
    res.send({ message: 'Welcome to spotify-express-passport-auth-app!' })
  })

  return { app, port }
}