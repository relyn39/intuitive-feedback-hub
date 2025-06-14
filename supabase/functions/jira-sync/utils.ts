
export function mapJiraPriority(priority: string | undefined): 'low' | 'medium' | 'high' | 'critical' {
  if (!priority) return 'medium'
  const priorityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
    'Lowest': 'low',
    'Low': 'low',
    'Medium': 'medium',
    'High': 'high',
    'Highest': 'critical',
    'Critical': 'critical'
  }
  return priorityMap[priority] || 'medium'
}

export function mapJiraStatus(status: string | undefined): 'new' | 'in_progress' | 'resolved' | 'closed' {
  if (!status) return 'new'
  const statusMap: Record<string, 'new' | 'in_progress' | 'resolved' | 'closed'> = {
    'To Do': 'new',
    'Open': 'new',
    'In Progress': 'in_progress',
    'Done': 'resolved',
    'Closed': 'closed',
    'Resolved': 'resolved'
  }
  return statusMap[status] || 'new'
}
