"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, ShoppingBag, Menu } from "lucide-react"
import { useCart } from "@/context/CartContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet"

const navLinks = [
  { label: "Loja", href: "/loja" },
  { label: "Categorias", href: "/categorias" },
  { label: "Sobre", href: "/sobre" },
]

export function Header() {
  const { toggleCart, cartCount } = useCart()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#fafafa] border-b border-[#e5e5e5]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-5 text-[#1a1a1a]" />
            </Button>
          </div>

          {/* Logo */}
          <div className="flex lg:flex-none">
            <Link href="/" className="block">
              <span className="font-serif text-xl uppercase tracking-widest text-[#1a1a1a]">
                QUADROS
              </span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden lg:flex lg:items-center lg:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-[#1a1a1a]/70 transition-colors hover:text-[#1a1a1a]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/busca" aria-label="Search">
                <Search className="size-5 text-[#1a1a1a]" />
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCart}
              className="relative"
              aria-label="Open cart"
            >
              <ShoppingBag className="size-5 text-[#1a1a1a]" />
              {cartCount > 0 && (
                <Badge className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-[#1a1a1a] p-0 text-[10px] text-white">
                  {cartCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-72 bg-[#fafafa]">
          <SheetHeader className="border-b border-[#e5e5e5] pb-4">
            <SheetTitle className="font-serif text-lg uppercase tracking-widest text-[#1a1a1a]">
              QUADROS
            </SheetTitle>
          </SheetHeader>

          <nav className="flex flex-col gap-1 px-4 pt-4">
            {navLinks.map((link) => (
              <SheetClose asChild key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-md px-3 py-2.5 text-sm text-[#1a1a1a]/70 transition-colors hover:bg-[#e5e5e5]/50 hover:text-[#1a1a1a]"
                >
                  {link.label}
                </Link>
              </SheetClose>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  )
}
