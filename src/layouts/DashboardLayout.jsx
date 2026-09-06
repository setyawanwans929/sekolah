import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Menu, X, Sun, Moon, LogOut, Search, Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { MENUS } from './menuConfig'
import { ROLE_LABEL } from '../utils/roles'

export default function DashboardLayout({ role }) {
  const [open, setOpen] = useState(false)
  const { profile, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const menu = MENUS[role] || []

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <Brand />
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {menu.map((item) => <MenuItem key={item.to} {...item} />)}
        </nav>
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
          EduTrack v1.0 — {ROLE_LABEL[role]}
        </div>
      </aside>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-900 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <Brand compact />
              <button onClick={() => setOpen(false)}><X size={20} /></button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {menu.map((item) => <MenuItem key={item.to} {...item} onClick={() => setOpen(false)} />)}
            </nav>
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <button className="md:hidden" onClick={() => setOpen(true)}><Menu size={22} /></button>
            <div className="hidden sm:flex items-center gap-2 text-gray-400">
              <Search size={16} />
              <span className="text-sm">Cari siswa, guru, kelas...</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 relative">
              <Bell size={18} />
            </button>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium leading-tight">{profile?.full_name || profile?.email}</p>
              <p className="text-xs text-gray-400 leading-tight">{ROLE_LABEL[role]}</p>
            </div>
            <button onClick={handleLogout} className="btn btn-secondary px-2 py-2" title="Keluar">
              <LogOut size={16} />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function Brand({ compact }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-4 ${compact ? '' : 'border-b border-gray-100 dark:border-gray-800'}`}>
      <img src="/favicon.svg" alt="EduTrack" className="w-8 h-8" />
      <div>
        <p className="font-bold leading-tight text-brand-700 dark:text-brand-400">EduTrack</p>
        <p className="text-[10px] text-gray-400 leading-tight">Sistem Informasi Akademik</p>
      </div>
    </div>
  )
}

function MenuItem({ to, label, icon: Icon, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  )
}
