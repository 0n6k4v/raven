import React, { useState, useEffect, useRef, useCallback, useMemo, memo, startTransition } from "react";
import { useNavigate } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import { FaHome, FaCamera, FaUpload, FaHistory } from "react-icons/fa";
import { FaMapLocationDot, FaFolderOpen, FaChartSimple } from "react-icons/fa6";

/* ========================= CONSTANTS ========================= */
const MENU_ITEMS = Object.freeze([
  {
    id: "home",
    icon: <FaHome size={24} />,
    text: "หน้าหลัก",
    path: "/home",
    showInBottom: true,
  },
  {
    id: "camera",
    icon: <FaCamera size={24} />,
    text: "ถ่ายภาพ",
    path: "/camera",
    showInBottom: true,
    isSpecial: true,
  },
  {
    id: "upload",
    icon: <FaUpload size={24} />,
    text: "อัพโหลดภาพ",
    showInBottom: true,
  },
  {
    id: "history",
    icon: <FaHistory size={24} />,
    text: "ประวัติ",
    path: "/history",
    showInBottom: true,
  },
  {
    id: "selectCatalogType",
    icon: <FaFolderOpen size={24} />,
    text: "บัญชีวัตถุพยาน",
    path: "/selectCatalogType",
    showInBottom: false,
  },
  {
    id: "dashboard",
    icon: <FaChartSimple size={24} />,
    text: "แดชบอร์ด",
    path: "/dashboard",
    showInBottom: false,
  },
  {
    id: "map",
    icon: <FaMapLocationDot size={24} />,
    text: "แผนที่",
    path: "/map",
    showInBottom: true,
  },
]);

/* ========================= UTILS ========================= */
function getInitialSidebarState() {
  try {
    const saved = localStorage.getItem("sidebarState");
    return saved ? JSON.parse(saved) : true;
  } catch {
    return true;
  }
}

/* ========================= CUSTOM HOOKS ========================= */
function useResponsiveSidebar() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(getInitialSidebarState);

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
}

/* ========================= PRESENTATIONAL COMPONENTS ========================= */
const Sidebar = memo(function Sidebar({
  isSidebarOpen,
  activeTab,
  handleNavClick,
  handleUploadOptionClick,
  toggleSidebar,
}) {
  return (
    <aside className="h-full">
      <div
        className={`h-full ${
          isSidebarOpen ? "w-64" : "w-14"
        } bg-gradient-to-b from-[#2C2C2C] to-[#1A1A1A] text-white flex flex-col transition-all duration-300 overflow-hidden relative`}
      >
        <div className="p-4">
          <button
            onClick={toggleSidebar}
            className="text-white hover:text-gray-300 transition-colors cursor-pointer"
            aria-label="Toggle sidebar"
            type="button"
          >
            <FiMenu size={24} />
          </button>
        </div>
        <nav className="flex-1 space-y-1" aria-label="Main navigation">
          {MENU_ITEMS.map((item) => (
            <div key={item.id} className="relative">
              {activeTab === item.id && (
                <div className="absolute left-0 top-0 w-2 h-full bg-[#990000]" />
              )}
              <button
                onClick={(e) =>
                  item.id === "upload"
                    ? handleUploadOptionClick(e)
                    : handleNavClick(e, item.path, item.id)
                }
                className={`flex items-center space-x-6 px-4 py-4 w-full text-left hover:bg-[#444444] transition-all cursor-pointer ${
                  activeTab === item.id ? "bg-[#444444]" : ""
                }`}
                aria-current={activeTab === item.id ? "page" : undefined}
                type="button"
              >
                <div className="min-w-[24px]">{item.icon}</div>
                <span
                  className={`text-base whitespace-nowrap transition-opacity ${
                    isSidebarOpen ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {item.text}
                </span>
              </button>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
});

const BottomNav = memo(function BottomNav({
  activeTab,
  handleNavClick,
  isBottomSheetOpen,
  setIsBottomSheetOpen,
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40" aria-label="Bottom navigation">
      <div className="absolute inset-0 bg-[#333333] border-t border-gray-700/50" />
      <div className="relative h-16 px-4">
        <div className="flex items-center justify-between h-full">
          <button
            onClick={(e) => handleNavClick(e, "/home", "home")}
            className={`flex flex-col items-center justify-center w-16 h-full transition-all duration-200 ${
              activeTab === "home" ? "text-white" : "text-gray-400 hover:text-gray-200"
            } cursor-pointer`}
            aria-current={activeTab === "home" ? "page" : undefined}
            type="button"
          >
            <FaHome size={22} />
            <span className="text-[10px] mt-1 font-medium">หน้าหลัก</span>
          </button>
          <button
            onClick={(e) => handleNavClick(e, "/history", "history")}
            className={`flex flex-col items-center justify-center w-16 h-full transition-all duration-200 ${
              activeTab === "history" ? "text-white" : "text-gray-400 hover:text-gray-200"
            } cursor-pointer`}
            aria-current={activeTab === "history" ? "page" : undefined}
            type="button"
          >
            <FaHistory size={22} />
            <span className="text-[10px] mt-1 font-medium">ประวัติ</span>
          </button>
          <button
            onClick={(e) => handleNavClick(e, "/camera", "camera")}
            className="flex flex-col items-center justify-center w-16 -mt-6 cursor-pointer"
            type="button"
          >
            <div className="bg-crimson rounded-full p-4 shadow shadow-red-900/30 transition-transform duration-200 hover:scale-105 relative">
              <FaCamera size={24} className="text-white" />
            </div>
          </button>
          <button
            onClick={(e) => handleNavClick(e, "/map", "map")}
            className={`flex flex-col items-center justify-center w-16 h-full transition-all duration-200 ${
              activeTab === "map" ? "text-white" : "text-gray-400 hover:text-gray-200"
            } cursor-pointer`}
            aria-current={activeTab === "map" ? "page" : undefined}
            type="button"
          >
            <FaMapLocationDot size={22} />
            <span className="text-[10px] mt-1 font-medium">แผนที่</span>
          </button>
          <button
            onClick={() => setIsBottomSheetOpen(true)}
            className={`flex flex-col items-center justify-center w-16 h-full transition-all duration-200 ${
              isBottomSheetOpen ? "text-white" : "text-gray-400 hover:text-gray-200"
            } cursor-pointer`}
            aria-expanded={isBottomSheetOpen}
            type="button"
          >
            <FiMenu size={22} />
            <span className="text-[10px] mt-1 font-medium">เพิ่มเติม</span>
          </button>
        </div>
      </div>
    </nav>
  );
});

const BottomSheet = memo(function BottomSheet({
  isBottomSheetOpen,
  sheetTranslateY,
  sheetTransition,
  bottomSheetItems,
  closeBottomSheet,
  bottomSheetRef,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  handleBottomSheetItemClick,
}) {
  if (!isBottomSheetOpen && sheetTranslateY === "100%") return null;
  return (
    <div
      id="bottom-sheet-backdrop"
      className={`fixed inset-0 z-50 flex items-end justify-center transition-opacity duration-300 ${
        isBottomSheetOpen ? "bg-transparent" : "bg-transparent pointer-events-none"
      }`}
      onClick={isBottomSheetOpen ? closeBottomSheet : undefined}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={bottomSheetRef}
        className="bg-[#1A1A1A] rounded-t-xl w-full max-h-[70vh] flex flex-col will-change-transform"
        style={{
          transform: `translateY(${sheetTranslateY})`,
          transition: sheetTransition,
          touchAction: "none",
          visibility:
            !isBottomSheetOpen && sheetTranslateY !== "100%" ? "hidden" : "visible",
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex-shrink-0 w-full flex justify-center pt-3 pb-3 cursor-grab active:cursor-grabbing">
          <div className="w-10 h-1.5 bg-gray-500 rounded-full"></div>
        </div>
        <div className="flex-shrink-0 px-4 pb-4 flex items-center justify-between border-b border-gray-700/50">
          <h2 className="text-white text-lg font-medium">เมนูเพิ่มเติม</h2>
          <button
            onClick={closeBottomSheet}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 cursor-pointer"
            aria-label="Close menu"
            type="button"
          >
            <FiX size={20} />
          </button>
        </div>
        <div className="overflow-y-auto flex-grow" style={{ touchAction: "pan-y" }}>
          <div className="grid grid-cols-4 gap-y-4 gap-x-2 px-4 py-4 pb-8">
            {bottomSheetItems.map((item) => (
              <button
                key={item.id}
                onClick={(e) => handleBottomSheetItemClick(e, item)}
                className="flex flex-col items-center justify-start p-2 rounded-lg hover:bg-[#333333] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#555555] cursor-pointer"
                style={{ minHeight: "90px" }}
                type="button"
              >
                <div className="text-white mb-2 h-12 w-12 flex items-center justify-center bg-[#444444] rounded-lg">
                  {item.icon}
                </div>
                <span className="text-white text-xs text-center leading-tight">
                  {item.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

/* ========================= MAIN COMPONENT ========================= */
const Navigation = memo(function Navigation() {
  const navigate = useNavigate();
  const { isMobile, isSidebarOpen, setIsSidebarOpen } = useResponsiveSidebar();
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [sheetTranslateY, setSheetTranslateY] = useState("100%");
  const [sheetTransition, setSheetTransition] = useState(
    "transform 0.3s cubic-bezier(.4,0,.2,1)"
  );

  const bottomSheetRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);
  const sheetHeight = useRef(0);

  const bottomSheetItems = useMemo(
    () => [
      {
        id: "upload",
        icon: <FaUpload size={24} />,
        text: "อัพโหลดภาพ",
        action: "uploadOption",
      },
      ...MENU_ITEMS.filter((item) => !item.showInBottom),
    ],
    []
  );

  useEffect(() => {
    setActiveTab("home");
  }, []);

  useEffect(() => {
    if (isBottomSheetOpen) {
      requestAnimationFrame(() => {
        if (bottomSheetRef.current) {
          if (sheetHeight.current === 0) {
            sheetHeight.current = bottomSheetRef.current.offsetHeight;
          }
          setSheetTranslateY("0%");
          setSheetTransition("transform 0.3s cubic-bezier(.4,0,.2,1)");
        }
      });
    } else {
      setSheetTranslateY("100%");
      setSheetTransition("transform 0.3s cubic-bezier(.4,0,.2,1)");
    }
  }, [isBottomSheetOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isBottomSheetOpen &&
        bottomSheetRef.current &&
        !bottomSheetRef.current.contains(event.target) &&
        event.target.id === "bottom-sheet-backdrop"
      ) {
        closeBottomSheet();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isBottomSheetOpen]);

  const closeBottomSheet = useCallback(() => {
    setSheetTransition("transform 0.3s cubic-bezier(.4,0,.2,1)");
    setSheetTranslateY("100%");
    setTimeout(() => setIsBottomSheetOpen(false), 300);
  }, []);

  const handleUploadOptionClick = useCallback((e) => {
    e.stopPropagation();
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (ev) => {
      const file = ev.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          console.log("Preview image:", event.target.result);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
    closeBottomSheet();
  }, [closeBottomSheet]);

  const handleNavClick = useCallback(
    (e, path, id) => {
      e.stopPropagation();
      startTransition(() => setActiveTab(id));
      if (path) navigate(path);
      closeBottomSheet();
    },
    [navigate, closeBottomSheet]
  );

  const handleBottomSheetItemClick = useCallback(
    (e, item) => {
      if (item.action === "uploadOption") {
        handleUploadOptionClick(e);
      } else {
        handleNavClick(e, item.path, item.id);
      }
    },
    [handleUploadOptionClick, handleNavClick]
  );

  const handleTouchStart = useCallback((e) => {
    if (!bottomSheetRef.current) return;
    startY.current = e.touches[0].clientY;
    currentY.current = startY.current;
    isDragging.current = true;
    setSheetTransition("none");
    sheetHeight.current = bottomSheetRef.current.offsetHeight;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging.current || !bottomSheetRef.current) return;
    const y = e.touches[0].clientY;
    const diffY = y - startY.current;
    currentY.current = y;
    const newTranslateY = Math.max(0, diffY);
    bottomSheetRef.current.style.transform = `translateY(${newTranslateY}px)`;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current || !bottomSheetRef.current) {
      isDragging.current = false;
      return;
    }
    isDragging.current = false;
    setSheetTransition("transform 0.3s cubic-bezier(.4,0,.2,1)");
    const diffY = currentY.current - startY.current;
    const closeThreshold = sheetHeight.current > 0 ? sheetHeight.current * 0.25 : 80;
    if (diffY > closeThreshold) {
      closeBottomSheet();
    } else {
      setSheetTranslateY("0%");
      requestAnimationFrame(() => {
        if (bottomSheetRef.current) bottomSheetRef.current.style.transform = "";
      });
    }
    startY.current = 0;
    currentY.current = 0;
  }, [closeBottomSheet]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, [setIsSidebarOpen]);

  return (
    <>
      {isMobile ? (
        <>
          <BottomNav
            activeTab={activeTab}
            handleNavClick={handleNavClick}
            isBottomSheetOpen={isBottomSheetOpen}
            setIsBottomSheetOpen={setIsBottomSheetOpen}
          />
          <BottomSheet
            isBottomSheetOpen={isBottomSheetOpen}
            sheetTranslateY={sheetTranslateY}
            sheetTransition={sheetTransition}
            bottomSheetItems={bottomSheetItems}
            closeBottomSheet={closeBottomSheet}
            bottomSheetRef={bottomSheetRef}
            handleTouchStart={handleTouchStart}
            handleTouchMove={handleTouchMove}
            handleTouchEnd={handleTouchEnd}
            handleBottomSheetItemClick={handleBottomSheetItemClick}
          />
        </>
      ) : (
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          activeTab={activeTab}
          handleNavClick={handleNavClick}
          handleUploadOptionClick={handleUploadOptionClick}
          toggleSidebar={toggleSidebar}
        />
      )}
    </>
  );
});

export default Navigation;
