import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuth0 } from '@auth0/auth0-react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Editor } from '@/components/ui/editor'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

type FormState = {
  name: string
  description: string
  industry: string
  tagsInput: string
  banner: string
  body: string
}

type FieldErrors = Partial<Record<keyof FormState, string>> & { general?: string }

type Project = {
  id: string
  name: string
  description: string
  body: string
  tags: string[]
  industry: string
  banner: string
  authorId: string
}

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, '').trim()

const parseTags = (value: string) =>
  value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

export const Route = createFileRoute('/project/$id/edit')({
  component: EditProjectPage,
})

function EditProjectPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const { getAccessTokenSilently, isAuthenticated, isLoading, loginWithRedirect, user } = useAuth0()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState<FormState>({
    name: '',
    description: '',
    industry: '',
    tagsInput: '',
    banner: 'https://placehold.co/600x400',
    body: '',
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [projectLoading, setProjectLoading] = useState(true)
  const [projectError, setProjectError] = useState<string | null>(null)
  const [project, setProject] = useState<Project | null>(null)

  const textBodyLength = useMemo(() => stripHtml(form.body).length, [form.body])

  const validate = (state: FormState): FieldErrors => {
    const nextErrors: FieldErrors = {}
    if (!state.name || state.name.trim().length < 3 || state.name.trim().length > 100) {
      nextErrors.name = 'Name must be between 3 and 100 characters.'
    }
    if (!state.description || state.description.trim().length < 3 || state.description.trim().length > 100) {
      nextErrors.description = 'Description must be between 3 and 100 characters.'
    }
    if (textBodyLength < 20) {
      nextErrors.body = 'Body must be at least 20 characters.'
    }
    const tags = parseTags(state.tagsInput)
    if (tags.length === 0) {
      nextErrors.tagsInput = 'Add at least one tag.'
    }
    if (!state.industry) {
      nextErrors.industry = 'Industry is required.'
    }
    if (!state.banner) {
      nextErrors.banner = 'Banner is required.'
    }
    return nextErrors
  }

  useEffect(() => {
    let active = true
    const fetchProject = async () => {
      setProjectLoading(true)
      setProjectError(null)
      try {
        const res = await fetch(`${API_BASE}/projects/${id}`)
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          throw new Error(data?.message || 'Unable to load project.')
        }
        const data = (await res.json()) as Project
        if (active) {
          setProject(data)
          setForm({
            name: data.name,
            description: data.description,
            industry: data.industry,
            tagsInput: data.tags.join(', '),
            banner: data.banner,
            body: data.body,
          })
        }
      } catch (err) {
        if (active) {
          setProjectError(err instanceof Error ? err.message : 'Unable to load project.')
        }
      } finally {
        if (active) {
          setProjectLoading(false)
        }
      }
    }
    fetchProject()
    return () => {
      active = false
    }
  }, [id])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAlert(null)
    const validationErrors = validate(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      setAlert({ type: 'error', message: 'Please fix the highlighted errors.' })
      return
    }

    if (!isAuthenticated && !isLoading) {
      await loginWithRedirect({ appState: { returnTo: `/project/${id}/edit` } })
      return
    }

    if (project && user?.sub && project.authorId !== user.sub) {
      setAlert({ type: 'error', message: 'You are not authorized to edit this project.' })
      return
    }

    setIsSubmitting(true)
    try {
      const tags = parseTags(form.tagsInput)
      const audience = import.meta.env.VITE_AUTH0_AUDIENCE
      const scope = import.meta.env.VITE_AUTH0_SCOPE ?? 'openid profile email'

      let token: string | undefined
      try {
        token = await getAccessTokenSilently({
          authorizationParams: { audience, scope },
        })
      } catch {
        await loginWithRedirect({
          authorizationParams: { audience, scope, prompt: 'consent' },
          appState: { returnTo: `/project/${id}/edit` },
        })
        setIsSubmitting(false)
        return
      }

      const response = await fetch(`${API_BASE}/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          body: form.body,
          tags,
          industry: form.industry,
          banner: form.banner,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        const message = Array.isArray(data?.message) ? data.message.join(' ') : data?.message
        setAlert({ type: 'error', message: message || 'Failed to update project.' })

        if (Array.isArray(data?.message)) {
          const fieldErrorUpdates: FieldErrors = {}
          data.message.forEach((msg: string) => {
            const lower = msg.toLowerCase()
            if (lower.includes('name')) fieldErrorUpdates.name = msg
            if (lower.includes('description')) fieldErrorUpdates.description = msg
            if (lower.includes('body')) fieldErrorUpdates.body = msg
            if (lower.includes('tag')) fieldErrorUpdates.tagsInput = msg
            if (lower.includes('industry')) fieldErrorUpdates.industry = msg
            if (lower.includes('banner')) fieldErrorUpdates.banner = msg
          })
          setErrors((prev) => ({ ...prev, ...fieldErrorUpdates }))
        }
        return
      }

      const updated = await response.json()
      setAlert({ type: 'success', message: 'Project updated successfully.' })
      setErrors({})

      navigate({ to: `/project/${updated.id}` })
    } catch (err) {
      setAlert({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unexpected error updating project.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (projectLoading) {
    return (
      <div className="container max-w-2xl py-10 px-4 md:px-0 mx-auto space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (projectError || !project) {
    return (
      <div className="container max-w-2xl py-10 px-4 md:px-0 mx-auto">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{projectError || 'Project not found.'}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const isAuthor = user?.sub && project.authorId === user.sub

  return (
    <div className="container max-w-2xl py-10 px-4 md:px-0 mx-auto">
      <div className="mb-8 space-y-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Project</h1>
            <p className="text-muted-foreground">
              Update your project details below.
            </p>
          </div>
          {!isAuthor && (
            <Alert variant="destructive" className="max-w-sm">
              <AlertTitle>Not authorized</AlertTitle>
              <AlertDescription>You cannot edit this project.</AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {alert && (
          <Alert variant={alert.type === 'success' ? 'success' : 'destructive'}>
            <AlertTitle>{alert.type === 'success' ? 'Success' : 'Error'}</AlertTitle>
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="grid gap-2">
            <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Project Name
            </label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. AI-Powered Analytics"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              aria-invalid={Boolean(errors.name)}
              disabled={!isAuthor}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="grid gap-2">
            <label htmlFor="industry" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Industry
            </label>
            <select
              id="industry"
              name="industry"
              value={form.industry}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              aria-invalid={Boolean(errors.industry)}
              disabled={!isAuthor}
            >
              <option value="" disabled>Select an industry</option>
              <option value="Tech">Technology</option>
              <option value="Finance">Finance</option>
              <option value="Health">Healthcare</option>
              <option value="Education">Education</option>
              <option value="Retail">Retail</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Other">Other</option>
            </select>
            {errors.industry && <p className="text-sm text-destructive">{errors.industry}</p>}
          </div>

          <div className="grid gap-2">
            <label htmlFor="description" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Short Description
            </label>
            <input
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="A brief summary of your project..."
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              aria-invalid={Boolean(errors.description)}
              disabled={!isAuthor}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Full Description / Body
            </label>
            <Editor
              value={form.body}
              onChange={(val) => {
                setForm((prev) => ({ ...prev, body: val }))
                setErrors((prev) => ({ ...prev, body: undefined }))
              }}
            />
            <p className="text-xs text-muted-foreground">Minimum 20 characters. Current: {textBodyLength}</p>
            {errors.body && <p className="text-sm text-destructive">{errors.body}</p>}
          </div>

          <div className="grid gap-2">
            <label htmlFor="tagsInput" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Tags
            </label>
            <input
              id="tagsInput"
              name="tagsInput"
              value={form.tagsInput}
              onChange={handleChange}
              placeholder="React, TypeScript, Prisma (comma separated)"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              aria-invalid={Boolean(errors.tagsInput)}
              disabled={!isAuthor}
            />
            <p className="text-[0.8rem] text-muted-foreground">
              Separate tags with commas.
            </p>
            {errors.tagsInput && <p className="text-sm text-destructive">{errors.tagsInput}</p>}
          </div>

          <div className="grid gap-2">
            <label htmlFor="banner" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Banner URL
            </label>
            <input
              id="banner"
              name="banner"
              value={form.banner}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              aria-invalid={Boolean(errors.banner)}
              disabled={!isAuthor}
            />
            {errors.banner && <p className="text-sm text-destructive">{errors.banner}</p>}
          </div>

        </div>

        <div className="flex gap-4 justify-end">
          <Button type="button" variant="ghost" onClick={() => navigate({ to: `/project/${id}` })}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !isAuthor}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Updating...' : 'Update Project'}
          </Button>
        </div>
      </form>
    </div>
  )
}
