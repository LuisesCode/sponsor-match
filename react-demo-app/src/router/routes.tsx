import { createHashRouter } from "react-router-dom";
import Home from "../pages/Home";
import NotFound from "../pages/NotFound";

/**
 * HashRouter (createHashRouter) statt BrowserRouter: GitHub Pages liefert nur
 * statische Dateien aus und kann Deep-Links wie /deals/123 ohne serverseitiges
 * Rewrite nicht auf index.html zurückführen. Mit Hash-Routing (#/deals/123)
 * bleibt jede Route auch nach Reload/Direktaufruf erreichbar.
 */
export const router = createHashRouter([
  { path: "/", element: <Home /> },
  { path: "*", element: <NotFound /> },
]);
