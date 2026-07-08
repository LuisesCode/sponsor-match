import { createHashRouter } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Onboarding from "../pages/Onboarding";
import Dashboard from "../pages/Dashboard";
import Listings from "../pages/Listings";
import ListingNew from "../pages/ListingNew";
import ListingDetail from "../pages/ListingDetail";
import Suche from "../pages/Suche";
import Profile from "../pages/Profile";
import NotFound from "../pages/NotFound";
import { RequireAuth } from "@/components/app/RequireAuth";
import { AppShell } from "@/components/app/AppShell";

/**
 * HashRouter (createHashRouter) statt BrowserRouter: GitHub Pages liefert nur
 * statische Dateien aus und kann Deep-Links wie /deals/123 ohne serverseitiges
 * Rewrite nicht auf index.html zurückführen. Mit Hash-Routing (#/deals/123)
 * bleibt jede Route auch nach Reload/Direktaufruf erreichbar.
 */
export const router = createHashRouter([
  { path: "/", element: <Home /> },
  { path: "/login", element: <Login /> },
  { path: "/registrieren", element: <Register /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: "/onboarding", element: <Onboarding /> },
          { path: "/dashboard", element: <Dashboard /> },
          { path: "/suche", element: <Suche /> },
          { path: "/listings", element: <Listings /> },
          { path: "/listings/neu", element: <ListingNew /> },
          { path: "/listings/:id", element: <ListingDetail /> },
          { path: "/profil/:slug", element: <Profile /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFound /> },
]);
