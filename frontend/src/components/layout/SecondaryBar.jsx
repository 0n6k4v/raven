import React, { useRef, useEffect, useCallback, memo } from "react";
import { FaSignOutAlt, FaBell } from "react-icons/fa";
import { useUser } from "../../features/auth";
import { useDropdown } from "../../hooks/useDropdown";

// ============================================================================
// APPLICATION LAYER - Hooks & Use Cases
// ============================================================================

const useDropdownLogic = () => {
  const [showDropdown, setShowDropdown] = useDropdown();

  const toggleDropdown = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setShowDropdown((prev) => !prev);
  }, [setShowDropdown]);

  const closeDropdown = useCallback(() => setShowDropdown(false), [setShowDropdown]);

  useEffect(() => {
    if (!showDropdown) return;
    const handleDocumentClick = () => closeDropdown();
    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleDocumentClick, { once: true });
    }, 10);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("click", handleDocumentClick, { once: true });
    };
  }, [showDropdown, closeDropdown]);

  return { showDropdown, toggleDropdown, closeDropdown };
};

// ============================================================================
// PRESENTATION LAYER - UI Components
// ============================================================================

const NotificationBtn = memo(({ className = "" }) => (
  <button className={className} aria-label="Notifications">
    <FaBell className="text-gray-700 text-xl" />
  </button>
));

const AvatarCircle = memo(({ initial, onClick, className = "" }) => (
  <div className={className} onClick={onClick}>
    {initial}
  </div>
));

const UserDropdownContent = memo(({ user, onLogout, show, isMobile, onDropdownClick }) => {
  if (!show) return null;

  if (isMobile) {
    return (
      <div className="absolute right-0 top-10 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20 p-3" onClick={onDropdownClick}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-blue-600">
            {user.initials}
          </div>
          <div className="text-sm font-medium text-gray-800 truncate max-w-[100px]">
            {user.fullName}
          </div>
        </div>
        <button onClick={onLogout} className="w-full flex items-center gap-2 px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
          <FaSignOutAlt className="text-gray-600" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute right-1 top-[42px] w-64 bg-white rounded-md shadow-lg border border-gray-200 z-20" onClick={onDropdownClick}>
      <div className="p-4 border-b border-gray-100">
        <div className="text-xs text-gray-500 uppercase mb-1">{user.department}</div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-blue-600">
            {user.initials}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-800">
              {user.displayTitleName}
            </div>
            <div className="text-xs text-gray-500">{user.userId}</div>
            <div className="text-xs text-gray-500">{user.role}</div>
          </div>
        </div>
      </div>
      <div className="p-2">
        <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <FaSignOutAlt className="text-gray-600" />
          </div>
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT - Composition Root
// ============================================================================

const SecondaryBar = memo(function SecondaryBar() {
  const { user, logout } = useUser();
  const { showDropdown, toggleDropdown } = useDropdownLogic();
  const containerRef = useRef(null);

  const handleDropdownClick = useCallback((event) => {
    event.stopPropagation();
  }, []);

  return (
    <div className="w-full relative z-20 bg-white shadow-[0_1.5px_3px_rgba(0,0,0,0.25)]">
      
      {/* Mobile Layout */}
      <div className="sm:hidden h-[41px] flex items-center px-2 text-gray-800 justify-end gap-2 relative">
        <NotificationBtn className="px-2 py-2 rounded hover:bg-gray-200" />
        
        {user && (
          <div className="relative" ref={containerRef}>
            <AvatarCircle 
              initial={user.initials} 
              onClick={toggleDropdown} 
              className="w-[30px] h-[30px] rounded-full flex items-center justify-center bg-gray-100 border border-gray-200 text-blue-600 font-semibold text-sm shadow-sm ml-1 cursor-pointer"
            />
            <UserDropdownContent 
              user={user} 
              onLogout={logout} 
              show={showDropdown} 
              isMobile={true} 
              onDropdownClick={handleDropdownClick} 
            />
          </div>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:flex h-[40px] items-center text-gray-800 justify-end">
        <div className="flex items-center h-full">
          <div className="flex items-center h-full px-4 hover:bg-gray-100">
            <NotificationBtn className="h-full w-full hover:bg-gray-100 rounded-md transition-colors duration-150" />
          </div>
          
          {user && (
            <div className="flex items-center h-full px-4 hover:bg-gray-100 relative" ref={containerRef}>
              <div className="flex items-center gap-3 cursor-pointer group" onClick={toggleDropdown} aria-label="User menu">
                <div className="flex flex-col items-end">
                  <div className="text-[13px] font-medium text-gray-800">
                    {user.displayTitleName}
                  </div>
                  <div className="text-[12px] text-gray-600">
                    {user.role}
                  </div>
                </div>
                <AvatarCircle 
                  initial={user.initials} 
                  className="w-[30px] h-[30px] rounded-full flex items-center justify-center bg-gray-100 border border-gray-200 text-blue-600 font-semibold text-sm shadow-sm"
                />
              </div>
              <UserDropdownContent 
                user={user} 
                onLogout={logout} 
                show={showDropdown} 
                isMobile={false} 
                onDropdownClick={handleDropdownClick}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default SecondaryBar;