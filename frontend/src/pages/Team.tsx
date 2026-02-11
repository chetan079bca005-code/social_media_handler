import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  MoreVertical,
  Search,
  Crown,
  Edit2,
  Trash2,
  Check,
  Clock,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/Dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/DropdownMenu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/Select'
import toast from 'react-hot-toast'
import { teamApi } from '../services/api'
import { useWorkspaceStore } from '../store'

interface TeamMember {
  id: string
  userId: string
  role: string
  joinedAt: string
  user: {
    id: string
    name: string
    email: string
    avatarUrl?: string
    lastLoginAt?: string
  }
}

const ROLES = [
  {
    value: 'ADMIN',
    label: 'Admin',
    description: 'Full access to all features, can manage team members',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  },
  {
    value: 'EDITOR',
    label: 'Editor',
    description: 'Can create, edit, and publish content',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    value: 'VIEWER',
    label: 'Viewer',
    description: 'Can view content and analytics, no editing rights',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  },
]

const getRoleBadge = (role: string) => {
  const r = role.toUpperCase()
  switch (r) {
    case 'OWNER':
      return (
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          <Crown className="w-3 h-3 mr-1" />
          Owner
        </Badge>
      )
    case 'ADMIN':
      return (
        <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
          <Shield className="w-3 h-3 mr-1" />
          Admin
        </Badge>
      )
    case 'EDITOR':
      return (
        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          <Edit2 className="w-3 h-3 mr-1" />
          Editor
        </Badge>
      )
    default:
      return (
        <Badge variant="secondary">
          Viewer
        </Badge>
      )
  }
}

export function Team() {
  const { currentWorkspace } = useWorkspaceStore()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('EDITOR')
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editRole, setEditRole] = useState('')

  const workspaceId = currentWorkspace?.id

  const fetchMembers = useCallback(async () => {
    if (!workspaceId) return
    try {
      setLoading(true)
      const res = await teamApi.getMembers(workspaceId)
      setMembers(res?.data?.members || [])
    } catch (err: any) {
      toast.error(err.message || 'Failed to load team members')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const filteredMembers = members.filter(
    (m) =>
      m.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address')
      return
    }
    if (!workspaceId) {
      toast.error('No workspace selected')
      return
    }

    try {
      setInviting(true)
      await teamApi.invite(workspaceId, inviteEmail, inviteRole)
      toast.success(`Invitation sent to ${inviteEmail}`)
      setIsInviteModalOpen(false)
      setInviteEmail('')
      setInviteRole('EDITOR')
      fetchMembers()
    } catch (err: any) {
      toast.error(err.message || 'Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!workspaceId) return
    try {
      await teamApi.removeMember(workspaceId, memberId)
      toast.success('Team member removed')
      fetchMembers()
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove member')
    }
  }

  const handleUpdateRole = async () => {
    if (!selectedMember || !workspaceId) return
    try {
      await teamApi.updateRole(workspaceId, selectedMember.id, editRole)
      toast.success('Role updated successfully')
      setIsEditModalOpen(false)
      setSelectedMember(null)
      fetchMembers()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role')
    }
  }

  const activeCount = members.length
  const adminCount = members.filter((m) => m.role === 'ADMIN' || m.role === 'OWNER').length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            Team
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage your team members and permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchMembers} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsInviteModalOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{members.length}</p>
                <p className="text-sm text-slate-500">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeCount}</p>
                <p className="text-sm text-slate-500">Active Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{adminCount}</p>
                <p className="text-sm text-slate-500">Admins & Owners</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search team members..."
          className="pl-10"
        />
      </div>

      {/* Team List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage your team and their access permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mr-2" />
              <span className="text-slate-500">Loading team members...</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={member.user.avatarUrl}
                      alt={member.user.name}
                      fallback={member.user.name.split(' ').map((n) => n[0]).join('')}
                      size="md"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900 dark:text-white">{member.user.name}</p>
                        {member.role === 'OWNER' && (
                          <Crown className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{member.user.email}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {getRoleBadge(member.role)}
                    {member.role !== 'OWNER' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedMember(member)
                              setEditRole(member.role)
                              setIsEditModalOpen(true)
                            }}
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!loading && filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">No team members found</h3>
          <p className="text-slate-500 mt-1">
            {searchQuery ? 'Try adjusting your search' : 'Invite team members to get started'}
          </p>
        </div>
      )}

      {/* Roles Card */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>
            Understanding what each role can do
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ROLES.map((role) => (
              <div
                key={role.value}
                className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50"
              >
                <Badge className={role.color}>{role.label}</Badge>
                <p className="text-sm text-slate-600 dark:text-slate-400">{role.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Invite Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Email Address
              </label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="mt-1.5"
              />
              <p className="text-xs text-slate-400 mt-1">
                An invitation email will be sent to this address.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Role
              </label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div>
                        <p className="font-medium">{role.label}</p>
                        <p className="text-xs text-slate-500">{role.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={inviting}>
              {inviting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              {inviting ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Avatar
                  src={selectedMember.user.avatarUrl}
                  alt={selectedMember.user.name}
                  fallback={selectedMember.user.name.split(' ').map((n) => n[0]).join('')}
                />
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {selectedMember.user.name}
                  </p>
                  <p className="text-sm text-slate-500">{selectedMember.user.email}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  New Role
                </label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole}>
              <Check className="w-4 h-4 mr-2" />
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
