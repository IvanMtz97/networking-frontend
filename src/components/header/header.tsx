import { useAuth0 } from "@auth0/auth0-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

function Header() {

  const { user, isAuthenticated, isLoading, loginWithRedirect, logout } = useAuth0();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 w-full">
        <div className="mr-4 hidden md:flex">
          <a className="mr-6 flex items-center space-x-2" href="/">
            <span className="hidden font-bold sm:inline-block">
              Networking
            </span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          ) : isAuthenticated ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-auto py-1 px-2">
                  <span className="text-sm font-medium">{user?.name}</span>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.picture} alt={user?.name} />
                    <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56" align="end">
                <div className="flex flex-col space-y-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                  >
                    Log out
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <Button onClick={() => loginWithRedirect()}>Sign In</Button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
