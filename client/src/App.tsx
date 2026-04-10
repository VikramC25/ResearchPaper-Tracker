import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import { BookPlus, Library, BarChart3 } from "lucide-react";
import AddPaper from "./pages/AddPaper";
import EditPaper from "./pages/EditPaper";
import LibraryPage from "./pages/LibraryPage";
import AnalyticsPage from "./pages/AnalyticsPage";

function App() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-2">
              <BookPlus className="h-5 w-5 text-foreground" />
              <span className="text-base font-semibold tracking-tight">
                Research Tracker
              </span>
            </div>
            <div className="flex items-center gap-1">
              <NavLink
                to="/add"
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  }`
                }
              >
                <BookPlus className="h-4 w-4" />
                Add Paper
              </NavLink>
              <NavLink
                to="/library"
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  }`
                }
              >
                <Library className="h-4 w-4" />
                Library
              </NavLink>
              <NavLink
                to="/analytics"
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  }`
                }
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </NavLink>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Navigate to="/library" replace />} />
          <Route path="/add" element={<AddPaper />} />
          <Route path="/edit/:id" element={<EditPaper />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
