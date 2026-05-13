import React, { useState, useEffect, useRef, useCallback, memo, startTransition } from "react";
import { useNavigate } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import { FaHome, FaCamera, FaUpload, FaHistory } from "react-icons/fa";
import { FaMapLocationDot, FaFolderOpen, FaChartSimple } from "react-icons/fa6";

// ============================================================================
// DOMAIN LAYER - Pure Business Logic
// ============================================================================

export const MENU_CONFIG = Object.freeze([
  { id: "home", icon: <FaHome size={24} />, text: "หน้าหลัก", path: "/home", showInBottom: true },
  { id: "camera", icon: <FaCamera size={24} />, text: "ถ่ายภาพ", path: "/camera", showInBottom: true, isSpecial: true },
  { id: "upload", icon: <FaUpload size={24} />, text: "อัพโหลดภาพ", showInBottom: true },
  { id: "history", icon: <FaHistory size={24} />, text: "ประวัติ", path: "/history", showInBottom: true },
  { id: "selectCatalogType", icon: <FaFolderOpen size={24} />, text: "บัญชีวัตถุพยาน", path: "/selectCatalogType", showInBottom: false },
  { id: "dashboard", icon: <FaChartSimple size={24} />, text: "แดชบอร์ด", path: "/dashboard", showInBottom: false },
  { id: "map", icon: <FaMapLocationDot size={24} />, text: "แผนที่", path: "/map", showInBottom: true },
]);

class NavigationService {
  static getBottomSheetItems() {
    return [
      { id: "upload", icon: <FaUpload size={24} />, text: "อัพโหลดภาพ", action: "uploadOption" },
      ...MENU_CONFIG.filter(item => !item.showInBottom)
    ];
  }
}

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

const useResponsiveLayout = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    try {
      const saved = localStorage.getItem("sidebarState");
      return saved ? JSON.parse(saved) : true;
    } catch { return true; }
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarState", JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  return { isMobile, isSidebarOpen, setIsSidebarOpen };
};

const useBottomSheetPhysics = (onClose) => {
  const [translateY, setTranslateY] = useState("100%");
  const [transition, setTransition] = useState("transform 0.3s cubic-bezier(.4,0,.2,1)");
  const sheetRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = useCallback((e) => {
    if (!sheetRef.current) return;
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
    setTransition("none");
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging.current || !sheetRef.current) return;
    const y = e.touches[0].clientY;
    const diffY = y - startY.current;
    currentY.current = y;
    const newPos = Math.max(0, diffY);
    sheetRef.current.style.transform = `translateY(${newPos}px)`;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current || !sheetRef.current) return;
    isDragging.current = false;
    setTransition("transform 0.3s cubic-bezier(.4,0,.2,1)");
    
    const diffY = currentY.current - startY.current;
    const threshold = sheetRef.current.offsetHeight * 0.25;

    if (diffY > threshold) {
      onClose();
    } else {
      setTranslateY("0%");
      requestAnimationFrame(() => {
        if (sheetRef.current) sheetRef.current.style.transform = "";
      });
    }
  }, [onClose]);

  return { sheetRef, translateY, setTranslateY, transition, setTransition, handleTouchStart, handleTouchMove, handleTouchEnd };
};

const useFileUploadUseCase = (onComplete) => {
  return useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (ev) => {
      const file = ev.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => onComplete(e.target.result);
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }, [onComplete]);
};

// ============================================================================
// PRESENTATION LAYER - UI Components
// ============================================================================

const SidebarItem = memo(({ item, activeTab, isOpen, onClick }) => (
  <div className="relative">
    {activeTab === item.id && <div className="absolute left-0 top-0 w-2 h-full bg-[#990000]" />}
    <button
      onClick={onClick}
      className={`flex items-center space-x-6 px-4 py-4 w-full text-left hover:bg-[#444444] transition-all cursor-pointer ${
        activeTab === item.id ? "bg-[#444444]" : ""
      }`}
      aria-current={activeTab === item.id ? "page" : undefined}
      type="button"
    >
      <div className="min-w-[24px]">{item.icon}</div>
      <span className={`text-base whitespace-nowrap transition-opacity ${isOpen ? "opacity-100" : "opacity-0"}`}>
        {item.text}
      </span>
    </button>
  </div>
));

const BottomTab = memo(({ item, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-16 h-full transition-all duration-200 ${
      isActive ? "text-white" : "text-gray-400 hover:text-gray-200"
    } cursor-pointer`}
    aria-current={isActive ? "page" : undefined}
    type="button"
  >
    {item.icon}
    <span className="text-[10px] mt-1 font-medium">{item.text}</span>
  </button>
));

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const Navigation = memo(function Navigation() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const { isMobile, isSidebarOpen, setIsSidebarOpen } = useResponsiveLayout();

  const handleUploadComplete = useCallback((imageData) => {
    navigate("/imagePreview", {
      state: { imageData, sourcePath: "/home", fromCamera: false, uploadFromCameraPage: false }
    });
  }, [navigate]);

  const triggerUpload = useFileUploadUseCase(handleUploadComplete);

  const closeBottomSheet = useCallback(() => {
    physics.setTransition("transform 0.3s cubic-bezier(.4,0,.2,1)");
    physics.setTranslateY("100%");
    setTimeout(() => setIsBottomSheetOpen(false), 300);
  }, []);

  const physics = useBottomSheetPhysics(closeBottomSheet);

  const handleAction = useCallback((e, path, id, action) => {
    e.stopPropagation();
    if (action === "uploadOption" || id === "upload") {
      triggerUpload();
    } else {
      startTransition(() => setActiveTab(id));
      if (path) navigate(path);
    }
    closeBottomSheet();
  }, [navigate, triggerUpload, closeBottomSheet]);

  useEffect(() => {
    if (isBottomSheetOpen) {
      requestAnimationFrame(() => {
        physics.setTranslateY("0%");
        physics.setTransition("transform 0.3s cubic-bezier(.4,0,.2,1)");
      });
    } else {
      physics.setTranslateY("100%");
    }
  }, [isBottomSheetOpen]);

  if (!isMobile) {
    return (
      <aside className="h-full">
        <div className={`h-full ${isSidebarOpen ? "w-64" : "w-14"} bg-gradient-to-b from-[#2C2C2C] to-[#1A1A1A] text-white flex flex-col transition-all duration-300 overflow-hidden relative`}>
          <div className="p-4">
            <button onClick={() => setIsSidebarOpen(prev => !prev)} className="text-white hover:text-gray-300 transition-colors cursor-pointer" type="button">
              <FiMenu size={24} />
            </button>
          </div>
          <nav className="flex-1 space-y-1">
            {MENU_CONFIG.map(item => (
              <SidebarItem key={item.id} item={item} activeTab={activeTab} isOpen={isSidebarOpen} onClick={(e) => handleAction(e, item.path, item.id)} />
            ))}
          </nav>
        </div>
      </aside>
    );
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#333333] border-t border-gray-700/50 px-4">
        <div className="flex items-center justify-between h-full">
          <BottomTab item={{icon: <FaHome size={22}/>, text: "หน้าหลัก"}} isActive={activeTab === "home"} onClick={(e) => handleAction(e, "/home", "home")} />
          <BottomTab item={{icon: <FaHistory size={22}/>, text: "ประวัติ"}} isActive={activeTab === "history"} onClick={(e) => handleAction(e, "/history", "history")} />
          
          <button onClick={(e) => handleAction(e, "/camera", "camera")} className="flex flex-col items-center justify-center w-16 -mt-6 cursor-pointer" type="button">
            <div className="bg-crimson rounded-full p-4 shadow shadow-red-900/30 transition-transform duration-200 hover:scale-105">
              <FaCamera size={24} className="text-white" />
            </div>
          </button>

          <BottomTab item={{icon: <FaMapLocationDot size={22}/>, text: "แผนที่"}} isActive={activeTab === "map"} onClick={(e) => handleAction(e, "/map", "map")} />
          <button onClick={() => setIsBottomSheetOpen(true)} className={`flex flex-col items-center justify-center w-16 h-full transition-all ${isBottomSheetOpen ? "text-white" : "text-gray-400"}`} type="button">
            <FiMenu size={22} /><span className="text-[10px] mt-1 font-medium">เพิ่มเติม</span>
          </button>
        </div>
      </nav>

      {(isBottomSheetOpen || physics.translateY !== "100%") && (
        <div 
          id="bottom-sheet-backdrop" 
          className={`fixed inset-0 z-50 flex items-end justify-center transition-opacity duration-300 ${isBottomSheetOpen ? "bg-black/20" : "pointer-events-none"}`}
          onClick={closeBottomSheet}
        >
          <div
            ref={physics.sheetRef}
            className="bg-[#1A1A1A] rounded-t-xl w-full max-h-[70vh] flex flex-col will-change-transform"
            style={{ transform: `translateY(${physics.translateY})`, transition: physics.transition, touchAction: "none" }}
            onClick={e => e.stopPropagation()}
            onTouchStart={physics.handleTouchStart}
            onTouchMove={physics.handleTouchMove}
            onTouchEnd={physics.handleTouchEnd}
          >
            <div className="w-full flex justify-center pt-3 pb-3 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1.5 bg-gray-500 rounded-full" />
            </div>
            <div className="px-4 pb-4 flex items-center justify-between border-b border-gray-700/50">
              <h2 className="text-white text-lg font-medium">เมนูเพิ่มเติม</h2>
              <button onClick={closeBottomSheet} className="text-gray-400 hover:text-white p-1" type="button"><FiX size={20} /></button>
            </div>
            <div className="overflow-y-auto flex-grow" style={{ touchAction: "pan-y" }}>
              <div className="grid grid-cols-4 gap-y-4 gap-x-2 px-4 py-4 pb-8">
                {NavigationService.getBottomSheetItems().map(item => (
                  <button key={item.id} onClick={(e) => handleAction(e, item.path, item.id, item.action)} className="flex flex-col items-center p-2 rounded-lg hover:bg-[#333333]" style={{ minHeight: "90px" }}>
                    <div className="text-white mb-2 h-12 w-12 flex items-center justify-center bg-[#444444] rounded-lg">{item.icon}</div>
                    <span className="text-white text-xs text-center leading-tight">{item.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default Navigation;