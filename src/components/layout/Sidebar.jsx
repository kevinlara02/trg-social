import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Star, MessageSquare, Send, Link2,
  BarChart3, Settings, Menu, X, LogOut, Megaphone, Activity as ActivityIcon, Sparkles, Globe, TrendingUp,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { locationById } from '../../lib/supabase'
import { AlertsBell } from '../ui/AlertsBell'

// Only pages that work with real data are shown in the menu. Connections,
// AI Visibility and Activity stay hidden (demo-era pages pending the real
// backend); their routes still exist in App.jsx so they can be re-enabled.
const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/reviews',   icon: Star,            label: 'Reviews' },
  { to: '/inbox',     icon: MessageSquare,   label: 'Inbox' },
  { to: '/publish',   icon: Send,            label: 'Publish' },
  { to: '/social',    icon: Megaphone,       label: 'Social' },
]

const adminItems = [
  { to: '/reports',       icon: BarChart3,    label: 'Reports' },
  { to: '/trends',        icon: TrendingUp,   label: 'Trends' },
  { to: '/traffic',       icon: Globe,        label: 'Traffic' },
  { to: '/admin',         icon: Settings,     label: 'Users' },
]

function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-zinc-800 text-zinc-50 [&>svg]:text-accent-400'
            : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
        }`
      }
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span>{label}</span>
    </NavLink>
  )
}

export function Sidebar() {
  const { isAdmin, profile, role, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const close = () => setMobileOpen(false)

  const ROLE_LABELS = { admin: 'Administrator', manager: 'Manager', staff: 'Staff' }
  const roleLabel = ROLE_LABELS[role] || ''
  const restaurant = role !== 'admin' && profile?.location_id ? locationById(profile.location_id) : null

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-zinc-800">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-zinc-50 truncate">Digital Monitor</p>
              <p className="text-xs text-zinc-500 truncate">{roleLabel || 'Administrator'}</p>
            </div>
          </div>
          <AlertsBell />
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} onClick={close} />
        ))}
        {isAdmin && (
          <>
            <div className="pt-4 pb-1 px-4">
              <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Admin</p>
            </div>
            {adminItems.map((item) => (
              <NavItem key={item.to} {...item} onClick={close} />
            ))}
          </>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-zinc-800">
        {profile && (
          <div className="px-1">
            <div className="px-1 mb-2 flex items-center gap-2">
              {restaurant && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: restaurant.color }} />}
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-100 truncate">{profile.full_name || profile.email}</p>
                <p className="text-xs text-zinc-500 truncate">{roleLabel}{restaurant ? ` · ${restaurant.name}` : ''}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 bg-[#0c0c0e] border-r border-zinc-800">
        <SidebarContent />
      </div>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#0c0c0e] border-b border-zinc-800 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <span className="font-bold text-zinc-50 text-sm">Digital Monitor</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertsBell />
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-zinc-900 text-zinc-300">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={close} />
          <div className="relative w-72 bg-[#0c0c0e] h-full shadow-xl border-r border-zinc-800">
            <button onClick={close} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-zinc-900 text-zinc-400">
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  )
}
