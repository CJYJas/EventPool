import React, { useState, useRef, useEffect } from 'react';
import { Bell, ChevronDown, LogOut, RotateCcw, Search, ShieldCheck, User, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    currentView,
    navigate,
    marketplaceSearch,
    setMarketplaceSearch,
    loginAsDemo,
    logout,
    resetDemoData,
    getClubById,
    requests,
    accessRequests,
  } = useApp();

  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(marketplaceSearch);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalSearch(marketplaceSearch);
  }, [marketplaceSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userClub = getClubById(currentUser?.clubId);

  const notifications = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') {
      const pendingAccess = accessRequests
        .filter((a) => a.status === 'Pending')
        .map((a) => ({
          id: a.id,
          title: `Club access request: ${a.clubName}`,
          sub: `${a.representativeName} · ${a.submittedAt}`,
          target: () => navigate('admin_dashboard'),
        }));
      const pendingBorrows = requests
        .filter((r) => r.status === 'Pending')
        .slice(0, 3)
        .map((r) => ({
          id: r.id,
          title: `Pending request: ${r.eventName}`,
          sub: `${r.requestedQuantity} units · ${r.pickupDate}`,
          target: () => navigate('request_detail', { requestId: r.id }),
        }));
      return [...pendingAccess, ...pendingBorrows];
    }

    const incoming = requests
      .filter((r) => r.ownerClubId === currentUser.clubId && r.status === 'Pending')
      .map((r) => {
        const borrower = getClubById(r.borrowerClubId);
        return {
          id: r.id,
          title: `Incoming request from ${borrower?.acronym || 'Club'}`,
          sub: `${r.eventName} · ${r.requestedQuantity} units`,
          target: () => navigate('request_detail', { requestId: r.id }),
        };
      });

    const verifyReturns = requests
      .filter((r) => r.ownerClubId === currentUser.clubId && r.status === 'Return Pending')
      .map((r) => {
        const borrower = getClubById(r.borrowerClubId);
        return {
          id: r.id,
          title: `Return awaiting verification (${borrower?.acronym || 'Club'})`,
          sub: `${r.eventName} · ${r.requestedQuantity} units`,
          target: () => navigate('request_detail', { requestId: r.id }),
        };
      });

    return [...incoming, ...verifyReturns];
  }, [currentUser, accessRequests, requests, getClubById, navigate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMarketplaceSearch(localSearch);
    navigate('marketplace', { search: localSearch });
  };

  const navLinkClass = (active: boolean) =>
    `px-3.5 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
      active
        ? 'bg-[#DCE7D8] text-[#1F3626]'
        : 'text-[#3D4B41] hover:text-[#1F3626] hover:bg-[#F2EFE6]'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[#E5E2D9]">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => navigate('home')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D4A35] rounded-lg"
        >
          <span className="w-9 h-9 rounded-xl bg-[#EEF3EC] border border-[#D4E2D0] flex items-center justify-center shrink-0">
            <svg
              viewBox="0 0 28 28"
              className="w-6 h-6 text-[#2D4A35]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="4" y="6" width="16" height="14" rx="2.5" />
              <path d="M8 4v4M16 4v4M4 11h16" />
              <path d="M19 19l4-4M21 15c2 0 3.5 1.5 3.5 3.5S23 22 21 22s-3.5-1.5-3.5-3.5" />
            </svg>
          </span>
          <span className="text-xl font-bold tracking-tight text-[#435D47]">
            EventPool
          </span>
        </button>

        {/* Zone 2: Primary Navigation (Clubs right beside Home) */}
        <nav className="hidden md:flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => navigate('home')}
            className={navLinkClass(currentView === 'home')}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => navigate('clubs')}
            className={navLinkClass(
              currentView === 'clubs' || currentView === 'club_detail'
            )}
          >
            Clubs
          </button>
          <button
            type="button"
            onClick={() => navigate('marketplace')}
            className={navLinkClass(
              currentView === 'marketplace' ||
                currentView === 'resource_detail' ||
                currentView === 'borrow_form'
            )}
          >
            Marketplace
          </button>
          {currentUser?.role !== 'admin' && (
            <button
              type="button"
              onClick={() => {
                if (!currentUser) {
                  loginAsDemo('rep');
                } else {
                  navigate('my_club');
                }
              }}
              className={navLinkClass(
                currentView === 'my_club' || currentView === 'request_detail'
              )}
            >
              My Club
            </button>
          )}
          {currentUser?.role === 'admin' && (
            <button
              type="button"
              onClick={() => navigate('admin_dashboard')}
              className={navLinkClass(
                currentView === 'admin_dashboard' ||
                  currentView === 'request_detail'
              )}
            >
              Admin
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('sustainability')}
            className={navLinkClass(currentView === 'sustainability')}
          >
            Sustainability
          </button>
        </nav>

        {/* Search + Account Zone */}
        <div className="flex items-center gap-3 shrink-0">
          <form onSubmit={handleSearchSubmit} className="hidden xl:block relative w-64">
            <Search className="w-4 h-4 text-[#737B74] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                setMarketplaceSearch(e.target.value);
              }}
              placeholder="Search for resources..."
              className="w-full h-10 pl-10 pr-4 rounded-full bg-[#EFECE3] text-sm text-[#1F3626] placeholder:text-[#737B74] border border-transparent focus:border-[#2D4A35] focus:bg-white focus:outline-none transition-colors"
            />
          </form>

          {currentUser ? (
            <div className="flex items-center gap-2.5">
              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setNotifOpen((v) => !v)}
                  aria-label="Notifications"
                  className="relative w-10 h-10 rounded-full border border-[#E5E2D9] bg-white hover:bg-[#FAF8F2] flex items-center justify-center text-[#3D4B41] cursor-pointer transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#2D4A35] text-white text-[10px] font-mono font-semibold flex items-center justify-center tabular-nums">
                      {notifications.length}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-[#E5E2D9] shadow-lg py-2 z-50">
                    <div className="px-4 py-2 border-b border-[#EFECE3] flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#1F3626]">
                        Action Items
                      </span>
                      <span className="text-xs text-[#6B766E] tabular-nums">
                        {notifications.length} open
                      </span>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="px-4 py-4 text-xs text-[#6B766E]">
                        All caught up. No pending items right now.
                      </p>
                    ) : (
                      <div className="max-h-64 overflow-y-auto divide-y divide-[#F4F1E9]">
                        {notifications.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setNotifOpen(false);
                              item.target();
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-[#FAF8F2] transition-colors cursor-pointer"
                          >
                            <p className="text-xs font-semibold text-[#1F3626] truncate">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-[#6B766E] mt-0.5 truncate">
                              {item.sub}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="px-4 pt-2 mt-1 border-t border-[#EFECE3]">
                      <button
                        type="button"
                        onClick={() => {
                          setNotifOpen(false);
                          navigate('request_detail');
                        }}
                        className="w-full text-center py-1.5 text-xs font-semibold text-[#2D4A35] hover:underline cursor-pointer"
                      >
                        Open Requests Details &rarr;
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full hover:bg-[#F2EFE6] transition-colors cursor-pointer"
                >
                  <span className="w-9 h-9 rounded-full bg-[#2D4A35] text-white text-sm font-semibold flex items-center justify-center shrink-0">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="hidden sm:block text-left leading-tight">
                    <p className="text-xs font-semibold text-[#1F3626] whitespace-nowrap">
                      {currentUser.name}
                    </p>
                    <p className="text-[11px] text-[#6B766E] whitespace-nowrap">
                      {currentUser.role === 'admin'
                        ? 'UM Admin · System'
                        : `${userClub?.acronym || 'Club'} · Representative`}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#6B766E]" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl border border-[#E5E2D9] shadow-lg py-1.5 z-50">
                    <div className="px-4 py-2.5 border-b border-[#EFECE3]">
                      <p className="text-xs font-semibold text-[#1F3626]">
                        {currentUser.name}
                      </p>
                      <p className="text-[11px] text-[#6B766E] truncate">
                        {currentUser.email}
                      </p>
                    </div>
                    {currentUser.role === 'admin' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            navigate('admin_dashboard');
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#1F3626] hover:bg-[#FAF8F2] cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-[#2D4A35]" />
                          Admin Dashboard
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            navigate('clubs');
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#1F3626] hover:bg-[#FAF8F2] cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5 text-[#2D4A35]" />
                          Manage Clubs
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            loginAsDemo('rep');
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#4A554E] hover:bg-[#FAF8F2] cursor-pointer"
                        >
                          <User className="w-3.5 h-3.5" />
                          Switch to Club Rep (Alice)
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            navigate('my_club');
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#1F3626] hover:bg-[#FAF8F2] cursor-pointer"
                        >
                          <User className="w-3.5 h-3.5 text-[#2D4A35]" />
                          My Club Management
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            loginAsDemo('admin');
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#4A554E] hover:bg-[#FAF8F2] cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Switch to Admin View
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        resetDemoData();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#4A554E] hover:bg-[#FAF8F2] cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset Demo Data
                    </button>
                    <div className="my-1 border-t border-[#EFECE3]" />
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#8C2220] hover:bg-[#FDF2F2] cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loginAsDemo('admin')}
                className="px-3.5 py-2 rounded-lg text-xs font-medium text-[#2D4A35] bg-[#EEF3EC] hover:bg-[#DCE7D8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Admin Demo
              </button>
              <button
                type="button"
                onClick={() => loginAsDemo('rep')}
                className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-[#2D4A35] hover:bg-[#233B2A] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Club Rep Demo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Nav Row */}
      <div className="md:hidden border-t border-[#EFECE3] px-4 py-2 flex items-center gap-1.5 overflow-x-auto">
        <button
          type="button"
          onClick={() => navigate('home')}
          className={navLinkClass(currentView === 'home')}
        >
          Home
        </button>
        <button
          type="button"
          onClick={() => navigate('clubs')}
          className={navLinkClass(
            currentView === 'clubs' || currentView === 'club_detail'
          )}
        >
          Clubs
        </button>
        <button
          type="button"
          onClick={() => navigate('marketplace')}
          className={navLinkClass(currentView === 'marketplace')}
        >
          Marketplace
        </button>
        {currentUser?.role !== 'admin' && (
          <button
            type="button"
            onClick={() => {
              if (!currentUser) {
                loginAsDemo('rep');
              } else {
                navigate('my_club');
              }
            }}
            className={navLinkClass(
              currentView === 'my_club' || currentView === 'request_detail'
            )}
          >
            My Club
          </button>
        )}
        {currentUser?.role === 'admin' && (
          <button
            type="button"
            onClick={() => navigate('admin_dashboard')}
            className={navLinkClass(
              currentView === 'admin_dashboard' ||
                currentView === 'request_detail'
            )}
          >
            Admin
          </button>
        )}
        <button
          type="button"
          onClick={() => navigate('sustainability')}
          className={navLinkClass(currentView === 'sustainability')}
        >
          Sustainability
        </button>
      </div>
    </header>
  );
};
