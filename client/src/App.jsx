import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './components/theme-provider.jsx'
import LandingPage from './pages/LandingPage.jsx'
import AboutPage from './pages/AboutPage.jsx'
import HelpPage from './pages/HelpPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import DashboardLayout from './layouts/DashboardLayout.jsx'
import AdminLayout from './layouts/AdminLayout.jsx'
import DashboardHome from './pages/dashboard/DashboardHome.jsx'
import ReportsPage from './pages/dashboard/reports/ReportsPage.jsx'
import NewReportPage from './pages/dashboard/reports/NewReportPage.jsx'
import ReportDetailsPage from './pages/dashboard/reports/ReportDetailsPage.jsx'
import MapPage from './pages/dashboard/MapPage.jsx'
import TrafficDetailsPage from './pages/dashboard/TrafficDetailsPage.jsx'
import EnvironmentalDetailsPage from './pages/dashboard/EnvironmentalDetailsPage.jsx'
import CrowdInsightsPage from './pages/dashboard/crowd-insights/CrowdInsightsPage.jsx'
import CrowdInsightsCalendarPage from './pages/dashboard/crowd-insights/CrowdInsightsCalendarPage.jsx'
import WasteManagementPage from './pages/dashboard/waste-management/WasteManagementPage.jsx'
import WasteAnalyticsPage from './pages/dashboard/waste-management/WasteAnalyticsPage.jsx'
import InitiativesPage from './pages/dashboard/initiatives/InitiativesPage.jsx'
import NewInitiativePage from './pages/dashboard/initiatives/NewInitiativePage.jsx'
import InitiativeDetailsPage from './pages/dashboard/initiatives/InitiativeDetailsPage.jsx'
import CommunityPage from './pages/dashboard/CommunityPage.jsx'
import NotificationsPage from './pages/dashboard/NotificationsPage.jsx'
import TransitPage from './pages/dashboard/transit/TransitPage.jsx'
import TransitPlannerPage from './pages/dashboard/transit/TransitPlannerPage.jsx'
import TransitHistoryPage from './pages/dashboard/transit/TransitHistoryPage.jsx'
import SettingsPage from './pages/dashboard/SettingsPage.jsx'
import ProfilePage from './pages/dashboard/ProfilePage.jsx'
import AdminHome from './pages/admin/AdminHome.jsx'
import AdminReportsPage from './pages/admin/AdminReportsPage.jsx'
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx'
import AdminModerationPage from './pages/admin/AdminModerationPage.jsx'
import AdminWastePage from './pages/admin/AdminWastePage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="reports/new" element={<NewReportPage />} />
          <Route path="reports/:id" element={<ReportDetailsPage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="traffic" element={<TrafficDetailsPage />} />
          <Route path="environmental" element={<EnvironmentalDetailsPage />} />
          <Route path="crowd-insights" element={<CrowdInsightsPage />} />
          <Route path="crowd-insights/calendar" element={<CrowdInsightsCalendarPage />} />
          <Route path="waste-management" element={<WasteManagementPage />} />
          <Route path="waste-management/analytics" element={<WasteAnalyticsPage />} />
          <Route path="initiatives" element={<InitiativesPage />} />
          <Route path="initiatives/new" element={<NewInitiativePage />} />
          <Route path="initiatives/:id" element={<InitiativeDetailsPage />} />
          <Route path="community" element={<CommunityPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="transit" element={<TransitPage />} />
          <Route path="transit/planner" element={<TransitPlannerPage />} />
          <Route path="transit/history" element={<TransitHistoryPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminHome />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="moderation" element={<AdminModerationPage />} />
          <Route path="waste" element={<AdminWastePage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ThemeProvider>
  )
}
