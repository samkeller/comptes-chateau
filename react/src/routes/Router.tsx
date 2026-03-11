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

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/comptes",
    element: <AccountBook />,
  },
  {
    path: "/comptes/verifications",
    element: <AccountChecks />,
  },
  {
    path: "/budget",
    element: <Budget />,
  },
  {
    path: "/setup",
    element: <Setup />,
  },
  {
    path: "/kanban",
    element: <KanbanPage />,
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