import './App.css'
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { RouterUrl } from './routes';
import { AdminSide, Public, UserSide } from './layout';
import { AdminCardsPage, AdminDashboardPage, AdminTransactionPage, CardDetailsPage, LoginPage, ManageUsersPage, RegistrationPage, SwapRequestsPage, UserCardPage, UserHomepage, UserProfilePage } from './pages';
import { PrivacyPolicy } from './pages/public/login/privacyPolicy';

function App() {
  const router = createBrowserRouter([
    {
      path:RouterUrl.Login,
      element: <Public />,
      children: [
        { path: RouterUrl.Login, element: <LoginPage />},
        { path: RouterUrl.Registration, element: <RegistrationPage />},
        { path: RouterUrl.PrivacyPolicy, element: <PrivacyPolicy />},
      ]
    },
    {
      path:RouterUrl.Login,
      element: <UserSide />,
      children: [
        { path: RouterUrl.UserHomePage, element: <UserHomepage />},
        { path: RouterUrl.UserCard, element: <UserCardPage />},
        { path: RouterUrl.UserCardDetails, element: <CardDetailsPage />},
        { path: RouterUrl.UserOffersSwap, element: <SwapRequestsPage />},
        { path: RouterUrl.UserProfile, element: <UserProfilePage />},
      ]
    },
    {
      path: RouterUrl.Login,
      element:<AdminSide />,
      children:[
        { path: RouterUrl.AdminHome, element: <AdminDashboardPage />},
        { path: RouterUrl.AdminCard, element: <AdminCardsPage />},
        { path: RouterUrl.AdminTransaction, element: <AdminTransactionPage />},
        { path: RouterUrl.AdminUsersManage, element: <ManageUsersPage />},
      ]
    }
  ])
  return (
    <RouterProvider router={router} fallbackElement={<h6>Loading...</h6>} />
  )
}

export default App
