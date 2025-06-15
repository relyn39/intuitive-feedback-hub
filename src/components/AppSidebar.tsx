
import { Home, Settings, Database, BarChart3, BrainCircuit, Users, LogOut } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { Constants } from "@/integrations/supabase/types"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const items = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Feedback",
    url: "/feedback",
    icon: BarChart3,
    submenu: [
      {
        title: "Todos",
        url: "/feedback",
        icon: BarChart3,
      },
      ...Constants.public.Enums.feedback_source.map(source => ({
        title: source.charAt(0).toUpperCase() + source.slice(1),
        url: `/feedback/${source}`,
        icon: Database,
      }))
    ]
  },
  {
    title: "Insights",
    url: "/topics-analysis",
    icon: BrainCircuit,
  },
  {
    title: "Configurações",
    url: "/settings",
    icon: Settings,
    submenu: [
      {
        title: "Integrações",
        url: "/settings/integrations",
        icon: Database,
      },
      {
        title: "Inteligência Artificial",
        url: "/settings/ai",
        icon: BrainCircuit,
      },
      {
        title: "Usuários",
        url: "/settings/users",
        icon: Users,
      },
    ]
  },
]

export function AppSidebar() {
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/auth')
  }

  return (
    <Sidebar>
      <SidebarContent className="flex h-full flex-col justify-between">
        <SidebarGroup>
          <SidebarGroupLabel>Feedback-Hub</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <div key={item.title}>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname === item.url || (item.url !== '/' && location.pathname.startsWith(item.url))}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {item.submenu && location.pathname.startsWith(item.url) && (
                    <div className="ml-6 mt-1">
                      {item.submenu.map((subitem) => (
                        <SidebarMenuItem key={subitem.title}>
                          <SidebarMenuButton asChild isActive={location.pathname === subitem.url} size="sm">
                            <Link to={subitem.url}>
                              <subitem.icon />
                              <span>{subitem.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
           <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleLogout}>
                    <LogOut />
                    <span>Sair</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
           </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
