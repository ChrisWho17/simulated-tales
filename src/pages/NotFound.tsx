import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { APP_TITLE } from "@/lib/product";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f0f1a] px-4">
      <div className="text-center max-w-md">
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-amber-500/80 font-medium">
          {APP_TITLE}
        </p>
        <h1 className="mb-3 text-5xl font-serif text-foreground">404</h1>
        <p className="mb-6 text-lg text-muted-foreground">
          This path isn't part of the story.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-md bg-amber-700/90 px-5 py-2.5 text-sm font-medium text-amber-50 transition-colors hover:bg-amber-600"
        >
          Return to Untold
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
