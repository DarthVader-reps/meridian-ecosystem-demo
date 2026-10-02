import { Page } from '../components/layout'
import { Button, EmptyState } from '../components/ui'

export default function NotFound() {
  return (
    <Page title="Page not found">
      <EmptyState
        title="Nothing here"
        body="The page you asked for does not exist here."
        action={<Button to="/">Go home</Button>}
      />
    </Page>
  )
}
