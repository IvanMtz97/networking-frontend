import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuth0 } from '@auth0/auth0-react'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'

type ProfileSearch = {
  tab?: 'info' | 'projects'
}

type Project = {
  id: string
  name: string
  description: string
  industry: string
  tags: string[]
  banner: string
  createdAt: string
  authorId: string
}

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
  validateSearch: (search: Record<string, unknown>): ProfileSearch => {
    return {
      tab: (search.tab as 'info' | 'projects') || 'info',
    }
  },
})

// Mock Data matching Prisma Schema
const MOCK_PROJECTS = [
  {
    id: '1',
    name: 'Networking App',
    description: 'A professional networking platform for developers.',
    industry: 'Tech',
    tags: ['React', 'Node.js', 'Prisma'],
    banner: 'https://placehold.co/600x400',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'E-commerce Store',
    description: 'Full stack e-commerce solution with payment gateway.',
    industry: 'Retail',
    tags: ['Next.js', 'Stripe', 'Tailwind'],
    banner: 'https://placehold.co/600x400',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'AI Chatbot',
    description: 'Customer service chatbot using LLMs.',
    industry: 'AI',
    tags: ['Python', 'LangChain', 'OpenAI'],
    banner: 'https://placehold.co/600x400',
    createdAt: new Date().toISOString(),
  },
]

function ProfilePage() {
  const { user, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0()
  const { tab } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const [projects, setProjects] = useState<Project[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [projectsError, setProjectsError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/' })
    }
  }, [isLoading, isAuthenticated, navigate])

  useEffect(() => {
    if (tab !== 'projects') return
    let active = true
    const loadProjects = async () => {
      setProjectsLoading(true)
      setProjectsError(null)
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: import.meta.env.VITE_AUTH0_AUDIENCE,
            scope: import.meta.env.VITE_AUTH0_SCOPE ?? 'openid profile email',
          },
        }).catch(() => undefined)
        const authorParam = user?.sub ? `&authorId=${encodeURIComponent(user.sub)}` : ''
        const res = await fetch(`${API_BASE}/projects?page=0&limit=20${authorParam}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          throw new Error(data?.message || 'Unable to load projects')
        }
        const data = await res.json()
        if (active) {
          setProjects(data?.data ?? [])
        }
      } catch (err) {
        if (active) {
          setProjectsError(err instanceof Error ? err.message : 'Unable to load projects')
        }
      } finally {
        if (active) {
          setProjectsLoading(false)
        }
      }
    }

    loadProjects()
    return () => {
      active = false
    }
  }, [tab, user?.sub, getAccessTokenSilently])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex bg-background min-h-[calc(100vh-3.5rem)]">
      {/* Sidebar / Drawer */}
      <aside className="w-64 border-r bg-muted/30 hidden md:block">
        <div className="p-6">
          <h2 className="font-semibold text-lg tracking-tight mb-4">Settings</h2>
          <nav className="space-y-2">
            <Button
              variant={tab === 'info' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => navigate({ search: { tab: 'info' } })}
            >
              Information
            </Button>
            <Button
              variant={tab === 'projects' ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => navigate({ search: { tab: 'projects' } })}
            >
              My Projects
            </Button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8">
        {tab === 'info' && (
          <div className="max-w-2xl space-y-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Profile Information</h1>
              <p className="text-muted-foreground mt-2">
                Manage your personal information and account settings.
              </p>
            </div>

            <div className="flex items-center gap-6 p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user?.picture} alt={user?.name} />
                <AvatarFallback className="text-2xl">{user?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h3 className="font-semibold text-xl">{user?.name}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                {user?.nickname && (
                  <p className="text-xs text-muted-foreground">@{user.nickname}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border rounded-md">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Full Name</label>
                <p className="mt-1 text-sm text-muted-foreground">{user?.name}</p>
              </div>
              <div className="p-4 border rounded-md">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email Address</label>
                <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <div className="p-4 border rounded-md">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email Verified</label>
                <p className="mt-1 text-sm text-muted-foreground">{user?.email_verified ? 'Yes' : 'No'}</p>
              </div>
              <div className="p-4 border rounded-md">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Last Updated</label>
                <p className="mt-1 text-sm text-muted-foreground">{user?.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>

          </div>
        )}

        {tab === 'projects' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
                <p className="text-muted-foreground mt-2">
                  Manage and view all your created projects.
                </p>
              </div>
              <Button asChild>
                <Link to="/project/create">New Project</Link>
              </Button>
            </div>

            {projectsError && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{projectsError}</AlertDescription>
              </Alert>
            )}

            {projectsLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="space-y-3">
                    <Skeleton className="aspect-video w-full rounded" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ))}
              </div>
            ) : projects.length === 0 ? (
              <p className="text-muted-foreground">You have not created any projects yet.</p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    to="/project/$id"
                    params={{ id: project.id }}
                    className="group relative border rounded-lg overflow-hidden bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-video w-full overflow-hidden bg-muted">
                      <img
                        src={project.banner}
                        alt={project.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">{project.industry}</span>
                        <span className="text-xs text-muted-foreground">{new Date(project.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="font-semibold tracking-tight text-lg line-clamp-1">{project.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                      <div className="flex flex-wrap gap-1 pt-2">
                        {project.tags.map(tag => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded border bg-secondary/50 text-secondary-foreground">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
