import { Role } from "@/backend";
import { Layout } from "@/components/Layout";
import { RequirePermission } from "@/components/RequirePermission";
import { AuthProvider } from "@/hooks/use-auth";
import { ROLE_LEVEL } from "@/lib/permissions";
import { ApplicationReviewPage } from "@/pages/ApplicationReviewPage";
import { ApplicationsPage } from "@/pages/ApplicationsPage";
import { DepartmentsPage } from "@/pages/DepartmentsPage";
import { LoginPage } from "@/pages/LoginPage";
import { PositionOverviewPage } from "@/pages/PositionOverviewPage";
import { PositionsPage } from "@/pages/PositionsPage";
import { ReviewPage } from "@/pages/ReviewPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { StaffPage } from "@/pages/StaffPage";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Authenticated shell — wraps every portal page with the sidebar layout.
const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app",
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

// Public routes
const positionsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/",
  component: PositionsPage,
});

const positionOverviewRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/positions/$id",
  component: PositionOverviewPage,
});

// Applications — Dprt Lead+
const applicationsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/applications",
  component: () => (
    <RequirePermission level={ROLE_LEVEL[Role.dprtLead]}>
      <ApplicationsPage />
    </RequirePermission>
  ),
});

// Departments — Admin
const departmentsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/departments",
  component: () => (
    <RequirePermission level={ROLE_LEVEL[Role.admin]}>
      <DepartmentsPage />
    </RequirePermission>
  ),
});

// Staff — Dprt Lead+ (full management is Admin-only)
const staffRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/staff",
  component: () => (
    <RequirePermission level={ROLE_LEVEL[Role.dprtLead]}>
      <StaffPage />
    </RequirePermission>
  ),
});

// Review — Dprt Reviewer+
const reviewRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/review",
  component: () => (
    <RequirePermission level={ROLE_LEVEL[Role.dprtReviewer]}>
      <ReviewPage />
    </RequirePermission>
  ),
});

const applicationReviewRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/review/$id",
  component: () => (
    <RequirePermission level={ROLE_LEVEL[Role.dprtReviewer]}>
      <ApplicationReviewPage />
    </RequirePermission>
  ),
});

// Settings — Admin
const settingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/settings",
  component: () => (
    <RequirePermission level={ROLE_LEVEL[Role.admin]}>
      <SettingsPage />
    </RequirePermission>
  ),
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  appRoute.addChildren([
    positionsRoute,
    positionOverviewRoute,
    applicationsRoute,
    departmentsRoute,
    staffRoute,
    reviewRoute,
    applicationReviewRoute,
    settingsRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
