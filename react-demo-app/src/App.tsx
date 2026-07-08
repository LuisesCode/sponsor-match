import { RouterProvider } from "react-router-dom";
import { router } from "./router/routes";
import { SessionProvider } from "./auth/SessionContext";

function App() {
  return (
    <SessionProvider>
      <RouterProvider router={router} />
    </SessionProvider>
  );
}

export default App;
