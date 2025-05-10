import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Index from "@/pages/Index";
import Settings from "@/pages/Settings";
import Portfolio from "@/pages/Portfolio";
import AutoTrading from "@/pages/AutoTrading";
import MarketAnalysis from "@/pages/MarketAnalysis";
import Webhooks from "@/pages/Webhooks";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import Layout from "@/components/Layout";
import TelegramMonitorPage from "@/pages/TelegramMonitor";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Index />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "portfolio",
        element: <Portfolio />,
      },
      {
        path: "auto-trading",
        element: <AutoTrading />,
      },
      {
        path: "market-analysis",
        element: <MarketAnalysis />,
      },
      {
        path: "webhooks",
        element: <Webhooks />,
      },
      {
        path: "telegram-monitor",
        element: <TelegramMonitorPage />,
      }
    ],
  },
  {
    path: "/auth",
    element: <Auth />,
  },
]);

function App() {
  return (
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}

export default App;
