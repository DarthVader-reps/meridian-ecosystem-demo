import { Badge } from './ui'

/**
 * Marks where an admin page's data comes from, so live Supabase data is never
 * confused with the browser-local demo dataset.
 */
export default function DataSourceBadge({ live }: { live: boolean }) {
  return (
    <Badge tone={live ? 'green' : 'amber'}>
      {live ? 'Live Supabase data' : 'Sample data'}
    </Badge>
  )
}
