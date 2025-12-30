import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

type Project = {
  id: string
  name: string
  description: string
  body: string
  tags: string[]
  industry: string
  banner: string
  createdAt: string
  updatedAt: string
}

export const Route = createFileRoute('/project/$id')({
  component: ProjectDetailPage,
})

function ProjectDetailPage() {
  const { id } = Route.useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const fetchProject = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API_BASE}/projects/${id}`)
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          throw new Error(data?.message || 'Unable to load project.')
        }
        const data = (await res.json()) as Project
        if (active) {
          setProject(data)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unable to load project.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    fetchProject()
    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="container max-w-4xl py-10 px-4 md:px-0 mx-auto space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="container max-w-2xl py-10 px-4 md:px-0 mx-auto">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Project not found.'}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-10 px-4 md:px-0 mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {project.industry}
          </span>
          <span className="text-xs text-muted-foreground">
            Updated {new Date(project.updatedAt).toLocaleDateString()}
          </span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">{project.name}</h1>
        <p className="text-muted-foreground text-lg">{project.description}</p>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <img
          src={project.banner}
          alt={project.name}
          className="w-full h-[320px] object-cover"
        />
      </div>

      <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">
        <div dangerouslySetInnerHTML={{ __html: project.body }} />
      </div>

      <div className="flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span key={tag} className="text-xs px-2 py-1 rounded-full border bg-secondary/50 text-secondary-foreground">
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}
