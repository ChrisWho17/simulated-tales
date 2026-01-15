// ============================================================================
// BREADCRUMBS - Navigation breadcrumb trail
// ============================================================================

import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

// Route name mappings
const ROUTE_NAMES: Record<string, string> = {
  '/': 'Home',
  '/campaigns': 'Campaigns',
  '/profile': 'Profile',
  '/play': 'Play',
};

export function Breadcrumbs({ items, className, showHome = true }: BreadcrumbsProps) {
  const location = useLocation();
  
  // Auto-generate breadcrumbs from current path if not provided
  const breadcrumbItems: BreadcrumbItem[] = items || (() => {
    const paths = location.pathname.split('/').filter(Boolean);
    const crumbs: BreadcrumbItem[] = [];
    
    let currentPath = '';
    for (const path of paths) {
      currentPath += `/${path}`;
      crumbs.push({
        label: ROUTE_NAMES[currentPath] || path.charAt(0).toUpperCase() + path.slice(1),
        href: currentPath,
      });
    }
    
    // Last item shouldn't be clickable
    if (crumbs.length > 0) {
      crumbs[crumbs.length - 1].href = undefined;
    }
    
    return crumbs;
  })();

  if (breadcrumbItems.length === 0 && !showHome) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center text-sm', className)}>
      <ol className="flex items-center gap-1">
        {showHome && (
          <li className="flex items-center">
            <Link 
              to="/" 
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Home className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only">Home</span>
            </Link>
            {breadcrumbItems.length > 0 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 mx-1" />
            )}
          </li>
        )}
        
        {breadcrumbItems.map((item, index) => (
          <li key={index} className="flex items-center">
            {item.href ? (
              <Link 
                to={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium">
                {item.label}
              </span>
            )}
            {index < breadcrumbItems.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 mx-1" />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
