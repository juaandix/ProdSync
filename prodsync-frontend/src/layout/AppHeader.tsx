"use client";
import UserDropdown from "@/components/header/UserDropdown";
import React from "react";
import GlobalSearch from "@/components/header/GlobalSearch";

const AppHeader: React.FC = () => {
  return (
    <header className="flex items-center gap-3 shrink-0">
      <GlobalSearch />
      <UserDropdown />
    </header>
  );
};

export default AppHeader;
