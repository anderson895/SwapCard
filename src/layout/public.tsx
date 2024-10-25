import { Outlet } from 'react-router-dom'
import GoogleAd from '../components/GoogleAd'

export default function Public() {
  return (
  <div>
  <Outlet />
  <div className="fixed right-4 bottom-4 w-80 h-64">
  <GoogleAd client="ca-pub-3572738224547618" slot="4236934617" />
</div>
</div>
)
}
