import {
  createBrowserRouter,
  Navigate,
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
import UnifiedBudgetView from "@/pages/budget/UnifiedBudgetView";
import RecurringExpenses from "@/pages/budget/recurringExpenses/RecurringExpenses";
import AddRecurringExpenseDialog from "@/pages/budget/recurringExpenses/AddRecurringExpenseDialog";
import BudgetItemsTable from "@/pages/budget/BudgetItemsTable";
import ProtectedLayout from "./ProtectedLayout";
import { routePaths } from "./routePaths";
import StocksManagementPage from "@/pages/stocks/stocksManagement/StocksManagementPage";
import Stocks from "@/pages/stocks/Stocks";

const router = createBrowserRouter([
  {
    element: <ProtectedLayout />,
    children: [
      {
        path: routePaths.home,
        element: <Index />,
        handle: { navKey: "home" },
      },
      {
        path: routePaths.account.root,
        element: <AccountScopedOutlet />,
        children: [
          {
            index: true,
            element: <Navigate to="dashboard" replace />,
          },
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
                path: ":accountLineId",
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
            children: [
              {
                index: true,
                element: <Navigate to="overview" replace />,
              },
              {
                path: "overview",
                element: <UnifiedBudgetView />,
              },
              {
                path: "recurringExpenses",
                element: <RecurringExpenses />,
                children: [
                  {
                    path: ":expenseId",
                    element: <AddRecurringExpenseDialog />,
                  }
                ]
              },
              {
                path: "budgetLines",
                element: <BudgetItemsTable />,
              },
            ]
          },
        ]
      },
      {
        path: routePaths.setup,
        element: <Setup />,
        handle: { navKey: "setup" },
      },
      {
        path: routePaths.automatisations,
        element: <AccountLineCategorization />,
        handle: { navKey: "automatisations" },
      },
      {
        path: routePaths.stocks,
        element: <Stocks />,
        handle: { navKey: "stocks" },
        children: [
          {
            index: true,
            element: <Navigate to="stocksManagement" replace />,
          },
          {
            path: "stocksManagement",
            element: <StocksManagementPage />,
          },
          {
            path: "stocksManagement/:locationId",
            element: <StocksManagementPage />,
          },
        ],
      },
      {
        path: routePaths.kanban,
        element: <KanbanPage />,
        handle: { navKey: "kanban" },
      },
      {
        path: "*",
        element: <NotFoundPage />,
      }
    ]
  },
  {
    path: routePaths.auth,
    element: <AuthPage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  }
]);

export default router
