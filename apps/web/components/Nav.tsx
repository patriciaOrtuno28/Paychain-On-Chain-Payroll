"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button
              variant={pathname === "/" ? "default" : "ghost"}
              size="sm"
            >
              Home
            </Button>
          </Link>
          <Link href="/employer">
            <Button
              variant={pathname === "/employer" ? "default" : "ghost"}
              size="sm"
            >
              Employer
            </Button>
          </Link>
          <Link href="/employee">
            <Button
              variant={pathname === "/employee" ? "default" : "ghost"}
              size="sm"
            >
              Employee
            </Button>
          </Link>
        </div>
        <ThemeToggle />
      </div>
    </nav>
  );
}