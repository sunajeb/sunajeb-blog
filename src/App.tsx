
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import BlogPost from "./pages/BlogPost";
import NewBlogPost from "./pages/NewBlogPost";
import EditBlogPost from "./pages/EditBlogPost";
import NotFound from "./pages/NotFound";
import ReaderIndex from "./pages/ReaderIndex";
import ReaderBlogPost from "./pages/ReaderBlogPost";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.DEV ? '/' : './'}>
        <Routes>
          {/* Admin routes */}
          <Route path="/admin" element={<Index />} />
          <Route path="/admin/post/:id" element={<BlogPost />} />
          <Route path="/admin/new" element={<NewBlogPost />} />
          <Route path="/admin/edit/:id" element={<EditBlogPost />} />
          
          {/* Reader routes */}
          <Route path="/" element={<Navigate to="/read" replace />} />
          <Route path="/read" element={<ReaderIndex />} />
          <Route path="/read/post/:id" element={<ReaderBlogPost />} />
          
          {/* Legacy routes - redirect to admin */}
          <Route path="/post/:id" element={<Navigate to="/admin/post/:id" replace />} />
          <Route path="/new" element={<Navigate to="/admin/new" replace />} />
          <Route path="/edit/:id" element={<Navigate to="/admin/edit/:id" replace />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
