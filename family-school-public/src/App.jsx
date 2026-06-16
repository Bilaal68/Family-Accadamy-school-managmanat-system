import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { BrowserRouter } from "react-router-dom";

import AppRoutes from "@/routes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              border: "1px solid #E8E6FF",
              background: "#FFFFFF",
              color: "#10026B",
            },
            success: {
              iconTheme: { primary: "#10026B", secondary: "#FFFFFF" },
              style: { borderColor: "#10026B" },
            },
            error: {
              iconTheme: { primary: "#DC2626", secondary: "#FFFFFF" },
              style: { borderColor: "#DC2626", color: "#DC2626" },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
