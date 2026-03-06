import {
  createBrowserRouter,
} from "react-router-dom";
import Datas from "../pages/accountChecks/DatasImport";
import AccountBook from "../pages/accountBook/AccountBook";
import AuthPage from "../pages/AuthPage";
import NotFoundPage from "../pages/NotFoundPage";
import Budget from "../pages/budget/Budget";
import Index from "../pages/index/Index";
import Setup from "../pages/setup/Setup";
import AccountChecks from "../pages/accountChecks/AccountChecks";

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
    path: "/datas",
    element: <Datas />,
  },
  {
    path: "/setup",
    element: <Setup />,
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