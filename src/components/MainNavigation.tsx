
import React from "react";
import { Link } from "react-router-dom";
import { navItems, NavItem, useNavigation } from "@/components/AppNavigation";

const MainNavigation = () => {
  const { currentPath, isActivePath } = useNavigation();
  
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
      {navItems.map((item) => {
        // For mobile, we need to create new icons with smaller size
        const mobileIcon = React.isValidElement(item.icon) 
          ? React.cloneElement(item.icon as React.ReactElement, { size: 16 })
          : item.icon;
          
        return (
          <NavItem 
            key={item.path}
            to={item.path}
            icon={mobileIcon}
            label={item.label}
            isActive={currentPath === item.path}
            size="small"
          />
        );
      })}
    </div>
  );
};

export default MainNavigation;
