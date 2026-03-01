"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import type { ReactNode } from "react"
import {
  loginCustomer,
  registerCustomer,
  createCustomerProfile,
  getCustomerMe,
  updateCustomerMe,
  type MedusaCustomer,
} from "@/lib/medusa"

const AUTH_TOKEN_KEY = "quadros_auth_token"

interface AuthContextValue {
  customer: MedusaCustomer | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => Promise<void>
  logout: () => void
  updateProfile: (
    data: Partial<{ first_name: string; last_name: string; phone: string }>
  ) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<MedusaCustomer | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = customer !== null

  // On mount: check for existing token and fetch profile
  useEffect(() => {
    async function init() {
      const token = localStorage.getItem(AUTH_TOKEN_KEY)
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const { customer: me } = await getCustomerMe(token)
        setCustomer(me)
      } catch {
        // Token expired or invalid — clear it
        localStorage.removeItem(AUTH_TOKEN_KEY)
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { token } = await loginCustomer(email, password)
    localStorage.setItem(AUTH_TOKEN_KEY, token)

    const { customer: me } = await getCustomerMe(token)
    setCustomer(me)
  }, [])

  const register = useCallback(
    async (
      email: string,
      password: string,
      firstName: string,
      lastName: string
    ) => {
      const { token } = await registerCustomer(email, password)
      localStorage.setItem(AUTH_TOKEN_KEY, token)

      const { customer: created } = await createCustomerProfile(token, {
        email,
        first_name: firstName,
        last_name: lastName,
      })
      setCustomer(created)
    },
    []
  )

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    setCustomer(null)
  }, [])

  const updateProfile = useCallback(
    async (
      data: Partial<{ first_name: string; last_name: string; phone: string }>
    ) => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY)
      if (!token) throw new Error("Not authenticated")

      const { customer: updated } = await updateCustomerMe(token, data)
      setCustomer(updated)
    },
    []
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      customer,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
      updateProfile,
    }),
    [customer, isAuthenticated, isLoading, login, register, logout, updateProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
