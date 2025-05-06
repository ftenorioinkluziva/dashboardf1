"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false)

  // Evitar problemas de hidratação
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Renderizar apenas o children durante a montagem inicial no cliente
  // para evitar diferenças de hidratação
  if (!mounted) {
    return <>{children}</>
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
