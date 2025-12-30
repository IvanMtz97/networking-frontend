import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { Auth0Provider } from '@auth0/auth0-react'

import { routeTree } from './routeTree.gen'

import './index.css'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const auth0Audience = import.meta.env.VITE_AUTH0_AUDIENCE
const auth0Scope = import.meta.env.VITE_AUTH0_SCOPE ?? 'openid profile email'

console.log('CREDS', { auth0Audience, auth0Scope })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: auth0Audience,
        scope: auth0Scope,
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
    >
      <RouterProvider router={router} />
    </Auth0Provider>
  </StrictMode>,
)
