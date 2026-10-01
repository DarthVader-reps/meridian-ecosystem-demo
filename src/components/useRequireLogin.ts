import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { useUI } from '../store/ui'

/**
 * Guard for account-level mutations (membership tier changes, copy-trading,
 * plan starts, giveaway entries). These belong to a signed-in user; anonymous
 * visitors are sent to the login page and returned afterwards via `state.from`.
 *
 * Returns a function: call it at the top of the mutation handler. It returns
 * `true` when a user session exists, otherwise shows a notice, redirects to
 * /login, and returns `false`.
 */
export function useRequireLogin(): () => boolean {
  const user = useAuth((s) => s.user)
  const navigate = useNavigate()
  const location = useLocation()
  const pushToast = useUI((s) => s.pushToast)

  return () => {
    if (user) return true
    pushToast('Log in required', 'Log in or create an account to use this feature.')
    navigate('/login', { state: { from: location.pathname } })
    return false
  }
}
