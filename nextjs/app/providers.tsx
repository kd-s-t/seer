'use client'

import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig } from '@/lib/wagmi'
import { CurrencyProvider } from '@/contexts/CurrencyContext'
import theme from './theme'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
      staleTime: 1000,
    },
  },
})

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CurrencyProvider>
            <CssBaseline />
            {children}
          </CurrencyProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

