import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Settings, LogOut, HelpCircle, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Navigation() {
  const [location] = useLocation();
  const { user, profile } = useAuth();

  const navItems = [
    { name: "Dashboard", path: "/" },
    { name: "Connections", path: "/connections" },
    { name: "Alumni", path: "/alumni" },
    { name: "Compose", path: "/compose" },
    { name: "Analytics", path: "/analytics" },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const userName = user?.name || "User";
  const userEmail = user?.email || "user@example.com";
  const schoolInfo = profile?.school ? `${profile.school}${profile.major ? ` • ${profile.major}` : ''}` : 'No school info';

  return (
    <nav className="sticky top-0 z-50 px-4 py-3">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-soft-lg border border-border/50 max-w-7xl mx-auto">
        <div className="px-6 py-2">
          <div className="flex items-center justify-between">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-soft-md">
                <span className="text-white font-display font-bold text-lg">T</span>
              </div>
              <span className="font-display font-bold text-xl text-foreground hidden sm:block">Turnship</span>
            </div>

            {/* Centered Navigation Links */}
            <div className="flex-1 flex justify-center">
              <div className="hidden md:flex md:space-x-2">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <button
                    className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                      isActive(item.path)
                        ? "bg-purple-600 text-white shadow-soft-md transform scale-105"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-soft-sm"
                    }`}
                  >
                    {item.name}
                  </button>
                </Link>
              ))}
              </div>
            </div>
          
          {/* User menu */}
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative flex items-center space-x-2 px-3 py-2 rounded-full hover:bg-muted transition-all duration-300">
                  <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-display font-semibold">
                      {getInitials(userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:flex flex-col items-start">
                    <span className="text-sm font-semibold text-foreground">{userName}</span>
                    <span className="text-xs text-gray-600">{userEmail}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-2xl shadow-soft-xl border-border/50">
                <div className="px-4 py-3 border-b border-border/50">
                  <div className="font-semibold text-foreground font-display">{userName}</div>
                  <div className="text-sm text-gray-600">{userEmail}</div>
                  <div className="text-xs text-gray-500 mt-1">{schoolInfo}</div>
                </div>
                <DropdownMenuItem className="cursor-pointer rounded-xl mx-2 my-1 hover:bg-muted">
                  <Link href="/profile">
                    <div className="flex items-center w-full">
                      <User className="mr-3 h-4 w-4" />
                      Profile & Settings
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-xl mx-2 my-1 hover:bg-muted">
                  <Settings className="mr-3 h-4 w-4" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-xl mx-2 my-1 hover:bg-muted">
                  <HelpCircle className="mr-3 h-4 w-4" />
                  Help & Support
                </DropdownMenuItem>
                <div className="border-t border-border/50 my-2"></div>
                <DropdownMenuItem className="cursor-pointer rounded-xl mx-2 my-1 text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive">
                  <LogOut className="mr-3 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        </div>
      </div>
    </nav>
  );
}
