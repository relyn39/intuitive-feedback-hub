
import { Calendar, Home, Settings, Database, BarChart3, BrainCircuit, Users } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

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

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Plataforma de Feedback</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <div key={item.title}>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {item.submenu && (
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
      </SidebarContent>
    </Sidebar>
  )
}
