import { useAuth0 } from "@auth0/auth0-react";

function Header() {
  const { user, isAuthenticated, loginWithRedirect, logout } = useAuth0();
  console.log('USER', user)

  return (
    <header>
      <div className="flex flex-row w-full justify-between items-center px-4 h-16 bg-red-200">
        <h1>Networking</h1>
        {isAuthenticated ? (
          <button onClick={() => logout()}>Logout</button>
        ) : (
          <button onClick={() => loginWithRedirect()}>Login</button>
        )}
      </div>
    </header>
  )
}

export default Header;
