import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  path: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  const location = useLocation();
  
  // If no items are provided, generate them from the current path
  const breadcrumbs = items || generateBreadcrumbs(location.pathname);
  
  return (
    <div className="flex items-center text-sm text-gray-400 mb-4">
      <Link to="/" className="hover:text-white transition-colors">
        Dashboard
      </Link>
      
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={item.path}>
          <ChevronRight size={14} className="mx-2" />
          {index === breadcrumbs.length - 1 ? (
            <span className="text-white">{item.label}</span>
          ) : (
            <Link to={item.path} className="hover:text-white transition-colors">
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// Helper function to generate breadcrumbs from a path
const generateBreadcrumbs = (path: string): BreadcrumbItem[] => {
  const pathSegments = path.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];
  
  let currentPath = '';
  
  pathSegments.forEach((segment) => {
    currentPath += `/${segment}`;
    
    // Convert path segment to a readable label
    const label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    breadcrumbs.push({
      label,
      path: currentPath
    });
  });
  
  return breadcrumbs;
};

export default Breadcrumbs;
