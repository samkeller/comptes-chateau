import {
  createBrowserRouter,
} from "react-router-dom";
import AccountBook from "../pages/accountBook/AccountBook";
import AuthPage from "../pages/AuthPage";
import NotFoundPage from "../pages/NotFoundPage";
import Budget from "../pages/budget/Budget";
import Index from "../pages/index/Index";
import Setup from "../pages/setup/Setup";
import AccountChecks from "../pages/accountChecks/AccountChecks";
import KanbanPage from "../pages/kanban/KanbanPage";
import AccountDashboard from "../pages/accountDashboard/AccountDashboard";
import AccountScopedOutlet from "./AccountScopedOutlet";
import AccountLineCategorization from "@/pages/accountAutomatisations/accountLineCategorization/AccountLineCategorization";
import AddAccountLineDialog from "@/pages/accountBook/AddAccountLineDialog";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
    handle: { navKey: "home" },
  },
  {
    path: "/:accountId",
    element: <AccountScopedOutlet />, // Rafraichit tous les composants enfants lors du changement de compte
    children: [
      {
        path: "dashboard",
        element: <AccountDashboard />,
        handle: { navKey: "account-dashboard" },
      },
      {
        path: "accountBook",
        element: <AccountBook />,
        handle: { navKey: "account-book" },
        children: [
          {
            path: ":lineId",
            element: <AddAccountLineDialog />,
          }
        ]
      },
      {
        path: "accountChecks",
        element: <AccountChecks />,
        handle: { navKey: "account-checks" },
      },
      {
        path: "budget",
        element: <Budget />,
        handle: { navKey: "account-budget" },
      },

    ]
  },
  {
    path: "/setup",
    element: <Setup />,
    handle: { navKey: "setup" },
  },
  {
    path: "automatisations",
    element: <AccountLineCategorization />,
    handle: { navKey: "automatisations" },
  },
  {
    path: "/kanban",
    element: <KanbanPage />,
    handle: { navKey: "kanban" },
  },
  {
    path: "/auth",
    element: <AuthPage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  }
]);

export default router