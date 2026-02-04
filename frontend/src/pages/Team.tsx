import { useState } from 'react'
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

interface TeamMember {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  status: 'active' | 'pending' | 'inactive'
  joinedAt: string
  lastActive?: string
}

const MOCK_TEAM: TeamMember[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john@company.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    role: 'owner',
    status: 'active',
    joinedAt: '2023-06-15T10:00:00Z',
    lastActive: '2024-01-15T14:30:00Z',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@company.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    role: 'admin',
    status: 'active',
    joinedAt: '2023-07-20T09:00:00Z',
    lastActive: '2024-01-15T12:15:00Z',
  },
  {
    id: '3',
    name: 'Mike Chen',
    email: 'mike@company.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    role: 'editor',
    status: 'active',
    joinedAt: '2023-09-10T11:00:00Z',
    lastActive: '2024-01-14T16:45:00Z',
  },
  {
    id: '4',
    name: 'Emily Brown',
    email: 'emily@company.com',
    role: 'editor',
    status: 'pending',
    joinedAt: '2024-01-10T14:00:00Z',
  },
  {
    id: '5',
    name: 'David Lee',
    email: 'david@company.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    role: 'viewer',
    status: 'active',
    joinedAt: '2023-11-25T08:00:00Z',
    lastActive: '2024-01-13T10:30:00Z',
  },
]

const ROLES = [
  {
    value: 'admin',
    label: 'Admin',
    description: 'Full access to all features, can manage team members',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  },
  {
    value: 'editor',
    label: 'Editor',
    description: 'Can create, edit, and publish content',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    value: 'viewer',
    label: 'Viewer',
    description: 'Can view content and analytics, no editing rights',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  },
]

const getRoleBadge = (role: string) => {
  switch (role) {
    case 'owner':
      return (
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          <Crown className="w-3 h-3 mr-1" />
          Owner
        </Badge>
      )
    case 'admin':
      return (
        <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
          <Shield className="w-3 h-3 mr-1" />
          Admin
        </Badge>
      )
    case 'editor':
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

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
          Active
        </Badge>
      )
    case 'pending':
      return (
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      )
    default:
      return (
        <Badge variant="secondary">
          Inactive
        </Badge>
      )
  }
}

export function Team() {
  const [team, setTeam] = useState<TeamMember[]>(MOCK_TEAM)
  const [searchQuery, setSearchQuery] = useState('')
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('editor')
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editRole, setEditRole] = useState('')

  const filteredTeam = team.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address')
      return
    }

    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole as any,
      status: 'pending',
      joinedAt: new Date().toISOString(),
    }

    setTeam((prev) => [...prev, newMember])
    setIsInviteModalOpen(false)
    setInviteEmail('')
    setInviteRole('editor')
    toast.success(`Invitation sent to ${inviteEmail}`)
  }

  const handleRemoveMember = (id: string) => {
    setTeam((prev) => prev.filter((m) => m.id !== id))
    toast.success('Team member removed')
  }

  const handleUpdateRole = () => {
    if (!selectedMember) return

    setTeam((prev) =>
      prev.map((m) => (m.id === selectedMember.id ? { ...m, role: editRole as any } : m))
    )
    setIsEditModalOpen(false)
    setSelectedMember(null)
    toast.success('Role updated successfully')
  }

  const handleResendInvite = (email: string) => {
    toast.success(`Invitation resent to ${email}`)
  }

  const activeCount = team.filter((m) => m.status === 'active').length
  const pendingCount = team.filter((m) => m.status === 'pending').length

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
        <Button onClick={() => setIsInviteModalOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Member
        </Button>
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
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{team.length}</p>
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
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{pendingCount}</p>
                <p className="text-sm text-slate-500">Pending Invites</p>
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
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTeam.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar
                    src={member.avatar}
                    alt={member.name}
                    fallback={member.name.split(' ').map((n) => n[0]).join('')}
                    size="md"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900 dark:text-white">{member.name}</p>
                      {member.role === 'owner' && (
                        <Crown className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {getRoleBadge(member.role)}
                  {getStatusBadge(member.status)}
                  {member.role !== 'owner' && (
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
                        {member.status === 'pending' && (
                          <DropdownMenuItem onClick={() => handleResendInvite(member.email)}>
                            <Mail className="w-4 h-4 mr-2" />
                            Resend Invite
                          </DropdownMenuItem>
                        )}
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
        </CardContent>
      </Card>

      {filteredTeam.length === 0 && (
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
            <Button onClick={handleInvite}>
              <Mail className="w-4 h-4 mr-2" />
              Send Invitation
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
                  src={selectedMember.avatar}
                  alt={selectedMember.name}
                  fallback={selectedMember.name.split(' ').map((n) => n[0]).join('')}
                />
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {selectedMember.name}
                  </p>
                  <p className="text-sm text-slate-500">{selectedMember.email}</p>
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
