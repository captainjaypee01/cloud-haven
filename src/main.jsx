import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { AppProvider } from './context/AppContext.jsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CartProvider } from './context/CartContext.jsx'
import { PromoCodeProvider } from './context/PromoCodeContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { SidebarProvider } from './context/SidebarContext.jsx'

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Add your Clerk Publishable Key to the .env file')
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5min cache
    },
  },
});

createRoot(document.getElementById('root')).render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/"
    appearance={{
      elements: {
        profileSectionPrimaryButton__emailAddresses: { display: 'none' },
      },
    }}>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <SidebarProvider>
            <AppProvider>
              <CartProvider>
                <PromoCodeProvider>
                  <App />
                </PromoCodeProvider>
              </CartProvider>
            </AppProvider>
          </SidebarProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </ClerkProvider>,
)
