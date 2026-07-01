import React from "react";
import { LogOut } from "lucide-react";
import { UserProfile, UserRole } from "../types";

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  userProfile: UserProfile | null;
  userRole: UserRole;
  onSignOut: () => void;
}

export default function Navbar({
  currentTab,
  onNavigate,
  userProfile,
  userRole,
  onSignOut,
}: NavbarProps) {
  const showAdmin = ["admin", "moderator"].includes(userRole);

  const getRoleBadgeClass = (role: UserRole) => {
    switch (role) {
      case "admin": return "bg-[#F4C430] text-[#111111]";
      case "moderator": return "bg-[#111111] text-white";
      case "cr":
      case "locus_cr": return "bg-[#F4C430] text-[#111111]";
      default: return "bg-[#E5E5E5] text-[#111111]";
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case "admin": return "Admin";
      case "moderator": return "Mod";
      case "cr": return "CR";
      case "locus_cr": return "Locus CR";
      default: return "Student";
    }
  };

  const navItems = [
    { id: "home", label: "Home" },
    { id: "about", label: "About" },
    { id: "profiles", label: "Nerds" },
    { id: "events", label: "Events" },
    { id: "explore", label: "Explore" },
  ];

  return (
    <header className="border-b border-[#111111] bg-[#FFFFFF] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand / Logo */}
        <div
          onClick={() => onNavigate("home")}
          className="cursor-pointer flex items-center group select-none"
        >
          <div className="font-sans font-black text-2xl tracking-tighter uppercase bg-[#111111] text-white px-3 py-1 shadow-[3px_3px_0px_0px_rgba(244,196,48,1)] transition-transform group-hover:-translate-y-0.5">
            BCT<span className="text-[#F4C430]">AB</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-wrap items-center gap-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`text-[11px] font-sans font-bold uppercase tracking-widest transition-all py-1.5 px-3 border border-transparent ${
                  isActive
                    ? "bg-[#F4C430] text-[#111111] border-[#111111] shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-black"
                    : "text-[#8A8A8A] hover:text-[#111111] hover:bg-neutral-50"
                }`}
              >
                {item.label}
              </button>
            );
          })}

          {showAdmin && (
            <button
              onClick={() => onNavigate("admin")}
              className={`text-[11px] font-sans font-bold uppercase tracking-widest transition-all py-1.5 px-3 border border-transparent ${
                currentTab === "admin"
                  ? "bg-red-600 text-white border-[#111111] shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] font-black"
                  : "text-red-500/80 hover:text-red-600 hover:bg-red-50"
              }`}
            >
              Admin
            </button>
          )}
        </nav>

        {/* Profile Card & Log Out */}
        <div className="flex items-center gap-4">
          {userProfile && (
            <div className="text-right hidden sm:block">
              <span className="block font-sans font-bold text-[10px] text-[#8A8A8A] uppercase tracking-wider">
                {userProfile.email}
              </span>
              <span className={`inline-block px-1.5 py-0.5 text-[8px] font-sans font-bold uppercase tracking-wider mt-0.5 border border-[#111111] shadow-[1.5px_1.5px_0px_0px_rgba(17,17,17,1)] ${getRoleBadgeClass(userRole)}`}>
                {getRoleLabel(userRole)}
              </span>
            </div>
          )}

          <button
            onClick={onSignOut}
            className="bg-[#111111] text-white px-4 py-2.5 text-xs font-sans font-bold uppercase tracking-widest rounded-[2px] border border-[#111111] hover:bg-white hover:text-[#111111] hover:shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] transition-all flex items-center gap-1.5"
            title="Log out of Class Portal"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>

      </div>
    </header>
  );
}