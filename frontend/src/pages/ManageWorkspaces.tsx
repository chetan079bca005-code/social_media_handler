import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useWorkspaceStore } from '../store'
import { workspacesApi } from '../services/api'
import toast from 'react-hot-toast'

export function ManageWorkspaces() {
  const { currentWorkspace, setCurrentWorkspace, setWorkspaces, workspaces } = useWorkspaceStore()
  const [isLoading, setIsLoading] = useState(false)
  const [newName, setNewName] = useState('')
  const [createName, setCreateName] = useState('')

  const load = async () => {
    setIsLoading(true)
    try {
      const response = await workspacesApi.getAll()
      const list = response.workspaces || []
      setWorkspaces(list)
      if (!currentWorkspace && list.length > 0) {
        setCurrentWorkspace(list[0])
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load workspaces')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleUpdate = async () => {
    if (!currentWorkspace) {
      toast.error('Select a workspace')
      return
    }
    if (!newName.trim()) {
      toast.error('Enter a new name')
      return
    }

    setIsLoading(true)
    try {
      const response = await workspacesApi.update(currentWorkspace.id, { name: newName.trim() })
      const updated = response.workspace || response
      setWorkspaces(workspaces.map((w) => (w.id === updated.id ? updated : w)))
      setCurrentWorkspace(updated)
      setNewName('')
      toast.success('Workspace updated')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update workspace')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!createName.trim()) {
      toast.error('Enter a workspace name')
      return
    }

    setIsLoading(true)
    try {
      const response = await workspacesApi.create({ name: createName.trim() })
      const workspace = response.workspace || response
      setWorkspaces([...workspaces, workspace])
      setCurrentWorkspace(workspace)
      setCreateName('')
      toast.success('Workspace created')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create workspace')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manage Workspaces</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-slate-500">Loading...</p>}
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Current Workspace</div>
              <div className="text-slate-900 dark:text-white">{currentWorkspace?.name || 'None selected'}</div>
            </div>

            <div className="grid gap-3">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Rename current workspace"
              />
              <Button onClick={handleUpdate} disabled={isLoading}>Update Workspace</Button>
            </div>

            <div className="grid gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="New workspace name"
              />
              <Button onClick={handleCreate} disabled={isLoading}>Create Workspace</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
