
import React from "react";
import { navItems, NavItem, useNavigation } from "@/components/AppNavigation";

const MainNavigation = () => {
  const { currentPath } = useNavigation();
  
  return (
    <nav className="hidden md:flex items-center space-x-1">
      {navItems.map((item) => (
        <NavItem 
          key={item.path}
          to={item.path}
          icon={item.icon}
          label={item.label}
          isActive={currentPath === item.path}
        />
      ))}
    </nav>
  );
};

export const MobileNavigation = () => {
  const { currentPath } = useNavigation();
  
  return (
    <div className="flex flex-col space-y-1">
      {navItems.map((item) => (
        <NavItem 
          key={item.path}
          to={item.path}
          icon={item.icon}
          label={item.label}
          isActive={currentPath === item.path}
          size="small"
        />
      ))}
    </div>
  );
};

export default MainNavigation;
