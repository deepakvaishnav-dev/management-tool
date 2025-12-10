import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppSidebar } from "./AppSidebar";
import { useStore } from "@/store/useStore";

export function MainLayout() {
  const { user } = useStore();
  const navigate = useNavigate();
  const [sidebarWidth] = useState(280);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <motion.main
        initial={false}
        animate={{ marginLeft: sidebarWidth }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="flex-1 min-h-screen"
        style={{ marginLeft: 280 }}
      >
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </motion.main>
    </div>
  );
}
