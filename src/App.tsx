import { useState, useEffect } from 'react';
import { 
  INITIAL_VEHICLES, 
  INITIAL_FUEL_LOGS, 
  INITIAL_SPAREPARTS, 
  INITIAL_SERVICE_RECORDS 
} from './data/mockData';
import { 
  INITIAL_CHAT_SESSIONS, 
  DEFAULT_AI_SETTINGS 
} from './data/mockChat';
import { INITIAL_USER_PROFILE, type UserProfile } from './types/user';
import type { Vehicle, FuelLog, SparePart, ServiceRecord, TaxPaymentRecord, TripLog, OdometerLog } from './types';
import type { ChatSession, AiSettings } from './types/chat';
import { loadInitialData, saveToStorage, loadFromIndexedDB } from './utils/storage';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BottomNav, type TabType } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { VehiclesView } from './components/VehiclesView';
import { VehicleDetailView } from './components/VehicleDetailView';
import { AddVehiclePageView } from './components/AddVehiclePageView';
import { ProfileView } from './components/ProfileView';
import { FuelView } from './components/FuelView';
import { ServiceView } from './components/ServiceView';
import { AiChatView } from './components/AiChatView';
import { AiSettingsModal } from './components/AiSettingsModal';
import { ScanModal } from './components/ScanModal';
import { AddFuelModal } from './components/AddFuelModal';
import { AdjustFuelModal } from './components/AdjustFuelModal';
import { AdjustSparePartModal } from './components/AdjustSparePartModal';
import { AddServiceModal } from './components/AddServiceModal';
import { DigitalServicePdfModal } from './components/DigitalServicePdfModal';
import { NotificationModal } from './components/NotificationModal';
import { getSystemNotifications, getReadNotificationIds, saveReadNotificationIds } from './utils/notifications';
import { ThemeAccentModal } from './components/ThemeAccentModal';
import { TripLogPageView } from './components/TripLogPageView';
import { checkAndTriggerOdometerReminder } from './utils/odometerReminder';
import { PredictiveBudgetModal } from './components/PredictiveBudgetModal';
import { FleetMenuDrawer } from './components/FleetMenuDrawer';
import { InstallPwaModal } from './components/InstallPwaModal';
import { InstallPwaBanner } from './components/InstallPwaBanner';
import { executeThemeTransition } from './utils/themeTransition';
import { getSavedAccent, applyAccentToDocument, type AccentColorId } from './utils/themeAccent';

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedVehicleIdForDetail, setSelectedVehicleIdForDetail] = useState<string | null>(null);
  const [isAddingVehiclePage, setIsAddingVehiclePage] = useState(false);
  const [isViewingProfile, setIsViewingProfile] = useState(false);
  const [isTripLogPage, setIsTripLogPage] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => getReadNotificationIds());

  // Dark Mode Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vms_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('vms_theme', theme);
  }, [theme]);

  const handleToggleTheme = (event?: React.MouseEvent) => {
    executeThemeTransition(event, theme, (newTheme) => {
      setTheme(newTheme);
    });
  };

  // Accent Theme State
  const [accentTheme, setAccentTheme] = useState<AccentColorId>(() => getSavedAccent());
  const [isThemeAccentModalOpen, setIsThemeAccentModalOpen] = useState(false);

  useEffect(() => {
    applyAccentToDocument(accentTheme);
  }, [accentTheme]);

  // Application Data States (Persistent IndexedDB + LocalStorage)
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => loadInitialData('vehicles', INITIAL_VEHICLES));
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(() => loadInitialData('fuelLogs', INITIAL_FUEL_LOGS));
  const [spareParts, setSpareParts] = useState<SparePart[]>(() => loadInitialData('spareParts', INITIAL_SPAREPARTS));
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>(() => loadInitialData('serviceRecords', INITIAL_SERVICE_RECORDS));

  // User Profile & Multi-SIM state
  const [userProfile, setUserProfile] = useState<UserProfile>(() => loadInitialData('userProfile', INITIAL_USER_PROFILE));
  const [tripLogs, setTripLogs] = useState<TripLog[]>(() => loadInitialData('tripLogs', []));
  const [odometerLogs, setOdometerLogs] = useState<OdometerLog[]>(() => loadInitialData('odometerLogs', []));

  // Chat Data States
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => loadInitialData('chatSessions', INITIAL_CHAT_SESSIONS));
  const [activeSessionId, setActiveSessionId] = useState<string>(() => INITIAL_CHAT_SESSIONS[0].id);
  const [aiSettings, setAiSettings] = useState<AiSettings>(() => loadInitialData('aiSettings', DEFAULT_AI_SETTINGS));

  // Auto-persist to IndexedDB and LocalStorage on state changes
  useEffect(() => { saveToStorage('vehicles', vehicles); }, [vehicles]);
  useEffect(() => { saveToStorage('fuelLogs', fuelLogs); }, [fuelLogs]);
  useEffect(() => { saveToStorage('spareParts', spareParts); }, [spareParts]);
  useEffect(() => { saveToStorage('serviceRecords', serviceRecords); }, [serviceRecords]);
  useEffect(() => { saveToStorage('userProfile', userProfile); }, [userProfile]);
  useEffect(() => { saveToStorage('tripLogs', tripLogs); }, [tripLogs]);
  useEffect(() => { saveToStorage('odometerLogs', odometerLogs); }, [odometerLogs]);
  useEffect(() => { saveToStorage('chatSessions', chatSessions); }, [chatSessions]);
  useEffect(() => { saveToStorage('aiSettings', aiSettings); }, [aiSettings]);

  // Reconcile all fleet data with IndexedDB on initial mount (Offline-First resilience)
  useEffect(() => {
    loadFromIndexedDB<Vehicle[]>('vehicles', INITIAL_VEHICLES).then((v) => { if (v && v.length > 0) setVehicles(v); });
    loadFromIndexedDB<FuelLog[]>('fuelLogs', INITIAL_FUEL_LOGS).then((f) => { if (f && f.length > 0) setFuelLogs(f); });
    loadFromIndexedDB<SparePart[]>('spareParts', INITIAL_SPAREPARTS).then((s) => { if (s && s.length > 0) setSpareParts(s); });
    loadFromIndexedDB<ServiceRecord[]>('serviceRecords', INITIAL_SERVICE_RECORDS).then((r) => { if (r && r.length > 0) setServiceRecords(r); });
    loadFromIndexedDB<TripLog[]>('tripLogs', []).then((t) => { if (t && t.length > 0) setTripLogs(t); });
    loadFromIndexedDB<OdometerLog[]>('odometerLogs', []).then((o) => { if (o && o.length > 0) setOdometerLogs(o); });
  }, []);

  // Modal Dialog States
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isAddFuelOpen, setIsAddFuelOpen] = useState(false);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [targetVehicleIdForFuel, setTargetVehicleIdForFuel] = useState<string | undefined>(undefined);
  const [targetVehicleIdForService, setTargetVehicleIdForService] = useState<string | undefined>(undefined);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isAdjustFuelOpen, setIsAdjustFuelOpen] = useState(false);
  const [targetVehicleIdForAdjustFuel, setTargetVehicleIdForAdjustFuel] = useState<string | undefined>(undefined);
  const [isAdjustPartOpen, setIsAdjustPartOpen] = useState(false);
  const [selectedPartForAdjust, setSelectedPartForAdjust] = useState<SparePart | null>(null);
  const [isFleetMenuOpen, setIsFleetMenuOpen] = useState(false);
  const [isPredictiveBudgetOpen, setIsPredictiveBudgetOpen] = useState(false);
  const [isInstallPwaOpen, setIsInstallPwaOpen] = useState(false);

  const handleUpdateSparePart = (updatedPart: SparePart) => {
    const nextParts = spareParts.map((p) => (p.id === updatedPart.id ? updatedPart : p));
    setSpareParts(nextParts);

    // Recalculate healthScore for this vehicle
    const vParts = nextParts.filter((p) => p.vehicleId === updatedPart.vehicleId);
    if (vParts.length > 0) {
      const avgHealth = Math.round(vParts.reduce((sum, p) => sum + p.estimatedLifeRemainingPct, 0) / vParts.length);
      setVehicles(vehicles.map((v) => (v.id === updatedPart.vehicleId ? { ...v, healthScore: avgHealth } : v)));
    }
  };

  const handleOpenAdjustPart = (part: SparePart) => {
    setSelectedPartForAdjust(part);
    setIsAdjustPartOpen(true);
  };

  const handleOpenAdjustFuel = (vehicleId?: string) => {
    setTargetVehicleIdForAdjustFuel(vehicleId);
    setIsAdjustFuelOpen(true);
  };

  // Centralized Odometer Sync: Otomatis hitung degradasi sisa umur suku cadang & healthScore saat KM bertambah
  const applyOdometerSync = (vehicleId: string, newKm: number) => {
    const targetVeh = vehicles.find((v) => v.id === vehicleId);
    if (!targetVeh || newKm <= targetVeh.currentOdometerKm) return;

    // 1. Hitung ulang sisa umur & status seluruh suku cadang armada ini
    const updatedParts = spareParts.map((part) => {
      if (part.vehicleId !== vehicleId) return part;
      const interval = part.recommendedIntervalKm || 5000;
      const kmUsed = Math.max(0, newKm - part.lastReplacedOdometerKm);
      const lifeRemainingPct = Math.max(0, Math.min(100, Math.round(((interval - kmUsed) / interval) * 100)));
      const status: 'optimal' | 'warning' | 'critical' = 
        lifeRemainingPct <= 15 ? 'critical' : lifeRemainingPct <= 35 ? 'warning' : 'optimal';
      return {
        ...part,
        estimatedLifeRemainingPct: lifeRemainingPct,
        status,
      };
    });
    setSpareParts(updatedParts);

    // 2. Hitung ulang rata-rata kesehatan armada (Health Score)
    const vParts = updatedParts.filter((p) => p.vehicleId === vehicleId);
    const avgHealth = vParts.length > 0 
      ? Math.round(vParts.reduce((sum, p) => sum + p.estimatedLifeRemainingPct, 0) / vParts.length) 
      : targetVeh.healthScore;

    setVehicles(vehicles.map((v) => 
      v.id === vehicleId ? { ...v, currentOdometerKm: newKm, healthScore: avgHealth } : v
    ));
  };

  // Handlers for Add Operations
  const handleSaveNewVehicleAndParts = (
    newVeh: Vehicle, 
    newParts: SparePart[], 
    initialFuelLog?: FuelLog
  ) => {
    setVehicles([newVeh, ...vehicles]);
    setSpareParts([...newParts, ...spareParts]);
    if (initialFuelLog) {
      setFuelLogs([initialFuelLog, ...fuelLogs]);
    }
    setIsAddingVehiclePage(false);
    setSelectedVehicleIdForDetail(newVeh.id);
  };

  const handleUpdateVehicle = (updatedVehicle: Vehicle) => {
    setVehicles(vehicles.map((v) => (v.id === updatedVehicle.id ? updatedVehicle : v)));
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    setVehicles(vehicles.filter((v) => v.id !== vehicleId));
    setSpareParts(spareParts.filter((p) => p.vehicleId !== vehicleId));
    setFuelLogs(fuelLogs.filter((l) => l.vehicleId !== vehicleId));
    setServiceRecords(serviceRecords.filter((s) => s.vehicleId !== vehicleId));
    setTripLogs(tripLogs.filter((t) => t.vehicleId !== vehicleId));
    setOdometerLogs(odometerLogs.filter((o) => o.vehicleId !== vehicleId));
    if (selectedVehicleIdForDetail === vehicleId) {
      setSelectedVehicleIdForDetail(null);
    }
  };

  const handleAddFuelLog = (newLog: FuelLog) => {
    setFuelLogs([newLog, ...fuelLogs]);
    applyOdometerSync(newLog.vehicleId, newLog.odometerKm);
  };

  const handleAddServiceRecord = (newRecord: ServiceRecord) => {
    setServiceRecords([newRecord, ...serviceRecords]);
    setVehicles(vehicles.map((v) => 
      v.id === newRecord.vehicleId && newRecord.odometerKm > v.currentOdometerKm
        ? { ...v, currentOdometerKm: newRecord.odometerKm }
        : v
    ));
  };

  const handleUpdateServiceRecord = (updatedRecord: ServiceRecord) => {
    setServiceRecords(serviceRecords.map((r) => r.id === updatedRecord.id ? updatedRecord : r));
    setVehicles(vehicles.map((v) => 
      v.id === updatedRecord.vehicleId && updatedRecord.odometerKm > v.currentOdometerKm
        ? { ...v, currentOdometerKm: updatedRecord.odometerKm }
        : v
    ));
  };

  const handleDeleteServiceRecord = (recordId: string) => {
    setServiceRecords(serviceRecords.filter((r) => r.id !== recordId));
  };

  // Handlers for Trip Logbook
  const handleAddTripLog = (newTrip: TripLog) => {
    setTripLogs([newTrip, ...tripLogs]);
    applyOdometerSync(newTrip.vehicleId, newTrip.endOdometerKm);
  };

  const handleToggleReimburse = (tripId: string) => {
    setTripLogs(tripLogs.map((t) => t.id === tripId ? { ...t, isReimbursed: !t.isReimbursed } : t));
  };

  const handleDeleteTripLog = (tripId: string) => {
    setTripLogs(tripLogs.filter((t) => t.id !== tripId));
  };

  // Handlers for Odometer Logging
  const handleAddOdometerLog = (newLog: OdometerLog) => {
    setOdometerLogs([newLog, ...odometerLogs]);
    applyOdometerSync(newLog.vehicleId, newLog.odometerKm);
  };

  const handleDeleteOdometerLog = (logId: string) => {
    setOdometerLogs(odometerLogs.filter((l) => l.id !== logId));
  };

  // Pengingat Harian Primetime Spedometer (18:00 - 21:00) 1x Sehari
  useEffect(() => {
    // Jalankan pengecekan saat startup
    checkAndTriggerOdometerReminder(vehicles, odometerLogs, tripLogs, fuelLogs);

    // Pengecekan berkala tiap 60 detik
    const reminderInterval = setInterval(() => {
      checkAndTriggerOdometerReminder(vehicles, odometerLogs, tripLogs, fuelLogs);
    }, 60000);

    // Pengecekan saat tab aktif kembali
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkAndTriggerOdometerReminder(vehicles, odometerLogs, tripLogs, fuelLogs);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(reminderInterval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [vehicles, odometerLogs, tripLogs, fuelLogs]);

  // Handler for adding tax payment
  const handleAddTaxPayment = (record: TaxPaymentRecord) => {
    setVehicles(vehicles.map((v) => {
      if (v.id !== record.vehicleId) return v;
      const history = v.taxPaymentHistory || [];
      return {
        ...v,
        taxPaymentHistory: [record, ...history],
      };
    }));
  };

  // Handler for AI Scan complete
  const handleScanComplete = (result: {
    vehicleId: string;
    detectedKm: number;
    detectedLiters?: number;
    detectedCost?: number;
    fuelType?: string;
  }) => {
    applyOdometerSync(result.vehicleId, result.detectedKm);

    if (result.detectedLiters && result.detectedCost) {
      const newLog: FuelLog = {
        id: `fl-${Date.now()}`,
        vehicleId: result.vehicleId,
        date: new Date().toISOString().split('T')[0],
        fuelType: (result.fuelType as any) || 'Pertamax',
        liters: result.detectedLiters,
        totalCost: result.detectedCost,
        odometerKm: result.detectedKm,
        stationName: 'SPBU Pertamina (AI Scan)',
        efficiencyKmPerLiter: undefined,
        fullTank: true,
      };
      setFuelLogs([newLog, ...fuelLogs]);
    }
  };

  // Chat Handlers
  const handleNewChat = () => {
    const newSessionId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'Percakapan Baru',
      lastMessage: 'Siap membantu armada Anda...',
      updatedAt: 'Baru saja',
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'ai',
          text: 'Halo! Saya **Fleet AI Assistant**. Ada yang bisa saya bantu terkait perawatan armada, konsumsi BBM, atau analisis foto hari ini?',
          timestamp: 'Baru saja',
        },
      ],
    };
    setChatSessions([newSession, ...chatSessions]);
    setActiveSessionId(newSessionId);
  };

  const handleSendMessage = (
    sessionId: string, 
    text: string, 
    sender: 'user' | 'ai' = 'user',
    attachment?: { type: 'image' | 'file'; url: string; name?: string }
  ) => {
    setChatSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;

        const newMsg = {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          sender,
          text,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          attachment,
        };

        const updatedMessages = [...s.messages, newMsg];
        return {
          ...s,
          lastMessage: text.slice(0, 60) + (text.length > 60 ? '...' : ''),
          updatedAt: 'Baru saja',
          title: s.title === 'Percakapan Baru' && sender === 'user' ? text.slice(0, 30) : s.title,
          messages: updatedMessages,
        };
      })
    );
  };

  const handleOpenAiChatWithPrompt = (initialPrompt?: string) => {
    setIsViewingProfile(false);
    setIsAddingVehiclePage(false);
    setSelectedVehicleIdForDetail(null);
    setActiveTab('chat');
    if (initialPrompt) {
      handleSendMessage(activeSessionId, initialPrompt, 'user');
    }
  };

  const criticalPartsCount = spareParts.filter((p) => p.status === 'critical').length;
  const systemNotifications = getSystemNotifications(vehicles, spareParts, userProfile);
  const urgentCount = systemNotifications.filter((n) => !readNotificationIds.includes(n.id)).length;

  // Selected vehicle for detail view
  const currentDetailVehicle = vehicles.find((v) => v.id === selectedVehicleIdForDetail);

  // Unified Navigation & Browser History Back Management
  const navigateTo = (options: {
    tab?: TabType;
    vehicleId?: string | null;
    isAdding?: boolean;
    isProfile?: boolean;
    isTripLog?: boolean;
  }) => {
    if (options.tab !== undefined) setActiveTab(options.tab);
    if (options.vehicleId !== undefined) setSelectedVehicleIdForDetail(options.vehicleId);
    if (options.isAdding !== undefined) setIsAddingVehiclePage(options.isAdding);
    if (options.isProfile !== undefined) setIsViewingProfile(options.isProfile);
    if (options.isTripLog !== undefined) setIsTripLogPage(options.isTripLog);

    if (typeof window !== 'undefined') {
      window.history.pushState(
        {
          tab: options.tab !== undefined ? options.tab : activeTab,
          vehicleId: options.vehicleId !== undefined ? options.vehicleId : selectedVehicleIdForDetail,
          isAdding: options.isAdding !== undefined ? options.isAdding : isAddingVehiclePage,
          isProfile: options.isProfile !== undefined ? options.isProfile : isViewingProfile,
          isTripLog: options.isTripLog !== undefined ? options.isTripLog : isTripLogPage,
        },
        ''
      );
    }
  };

  const handleGoBack = () => {
    // If browser history has an entry, trigger popstate
    if (typeof window !== 'undefined' && window.history.state) {
      window.history.back();
      return;
    }

    // Direct fallback
    if (isViewingProfile) {
      setIsViewingProfile(false);
      return;
    }
    if (isAddingVehiclePage) {
      setIsAddingVehiclePage(false);
      return;
    }
    if (isTripLogPage) {
      setIsTripLogPage(false);
      return;
    }
    if (selectedVehicleIdForDetail) {
      setSelectedVehicleIdForDetail(null);
      return;
    }
    if (activeTab === 'chat') {
      setActiveTab('dashboard');
      return;
    }
    if (activeTab !== 'dashboard') {
      setActiveTab('dashboard');
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.history.state) {
      window.history.replaceState(
        {
          tab: 'dashboard',
          vehicleId: null,
          isAdding: false,
          isProfile: false,
        },
        ''
      );
    }

    const onPopState = (e: PopStateEvent) => {
      const state = e.state;
      if (state) {
        if (state.tab !== undefined) setActiveTab(state.tab);
        setSelectedVehicleIdForDetail(state.vehicleId || null);
        setIsAddingVehiclePage(Boolean(state.isAdding));
        setIsViewingProfile(Boolean(state.isProfile));
        setIsTripLogPage(Boolean(state.isTripLog));
      } else {
        setIsViewingProfile(false);
        setIsAddingVehiclePage(false);
        setIsTripLogPage(false);
        setSelectedVehicleIdForDetail(null);
        setActiveTab('dashboard');
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // 1. IF ACTIVE TAB IS CHAT: Render full pure Chat AI experience
  if (activeTab === 'chat') {
    return (
      <>
        <AiChatView
          sessions={chatSessions}
          activeSessionId={activeSessionId}
          onSelectSession={(id) => setActiveSessionId(id)}
          onNewChat={handleNewChat}
          onSendMessage={handleSendMessage}
          onOpenSettings={() => setIsAiSettingsOpen(true)}
          onBackToHome={handleGoBack}
          settings={aiSettings}
          vehicles={vehicles}
          fuelLogs={fuelLogs}
          spareParts={spareParts}
          serviceRecords={serviceRecords}
          userProfile={userProfile}
        />

        <AiSettingsModal
          isOpen={isAiSettingsOpen}
          onClose={() => setIsAiSettingsOpen(false)}
          settings={aiSettings}
          onSaveSettings={(s) => setAiSettings(s)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex font-sans transition-colors">
      {/* Permanent Desktop Sidebar (Hidden on Mobile) */}
      <Sidebar
        activeTab={activeTab}
        onChangeTab={(tab) => {
          navigateTo({ tab, isProfile: false, isAdding: false, vehicleId: null });
        }}
        serviceBadgeCount={criticalPartsCount}
        profile={userProfile}
        onOpenProfile={() => {
          navigateTo({ isProfile: true, isAdding: false, vehicleId: null });
        }}
        onOpenFleetMenu={() => setIsFleetMenuOpen(true)}
        onOpenTripLog={() => navigateTo({ isTripLog: true, isProfile: false, isAdding: false, vehicleId: null })}
        onOpenPredictiveBudget={() => setIsPredictiveBudgetOpen(true)}
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-950 min-h-screen relative transition-colors">
        {/* Top Fleet Header */}
        <Header
          urgentCount={urgentCount}
          profile={userProfile}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onOpenAlerts={() => setIsNotificationModalOpen(true)}
          onOpenProfile={() => {
            navigateTo({ isProfile: true, isAdding: false, vehicleId: null });
          }}
          onOpenAiSettings={() => setIsAiSettingsOpen(true)}
          onOpenThemeAccent={() => setIsThemeAccentModalOpen(true)}
        />

        {/* Main View Area (Responsive up to 7xl on desktop) */}
        <main className="flex-1 px-4 md:px-8 py-4 max-w-7xl mx-auto w-full">
          {/* VIEW A: PROFILE & MULTI-SIM MANAGEMENT */}
          {isViewingProfile ? (
            <ProfileView
              profile={userProfile}
              onBack={handleGoBack}
              onUpdateProfile={(updated) => setUserProfile(updated)}
            />
          ) : isAddingVehiclePage ? (
            /* VIEW B: ADD VEHICLE FULL PAGE (AI SEARCH & AUTO-SUGGESTION) */
            <AddVehiclePageView
              onBack={handleGoBack}
              onSaveVehicle={handleSaveNewVehicleAndParts}
              aiSettings={aiSettings}
            />
          ) : isTripLogPage ? (
            /* VIEW E: TRIP LOGBOOK & SPEDOMETER FULL PAGE */
            <TripLogPageView
              vehicles={vehicles}
              tripLogs={tripLogs}
              fuelLogs={fuelLogs}
              odometerLogs={odometerLogs}
              onBack={handleGoBack}
              onAddTrip={handleAddTripLog}
              onToggleReimburse={handleToggleReimburse}
              onDeleteTrip={handleDeleteTripLog}
              onAddOdometerLog={handleAddOdometerLog}
              onDeleteOdometerLog={handleDeleteOdometerLog}
              initialVehicleId={selectedVehicleIdForDetail || undefined}
              aiSettings={aiSettings}
            />
          ) : selectedVehicleIdForDetail && currentDetailVehicle ? (
            /* VIEW C: VEHICLE DETAIL (INFO & PAJAK, BBM, SPAREPART) */
            <VehicleDetailView
              vehicle={currentDetailVehicle}
              fuelLogs={fuelLogs}
              spareParts={spareParts}
              serviceRecords={serviceRecords}
              onBack={handleGoBack}
              onAddFuelLog={() => setIsAddFuelOpen(true)}
              onOpenAdjustFuel={(vehId) => handleOpenAdjustFuel(vehId)}
              onOpenAdjustPart={handleOpenAdjustPart}
              onAddService={() => setIsAddServiceOpen(true)}
              onOpenAiChat={handleOpenAiChatWithPrompt}
              onAddTaxPayment={handleAddTaxPayment}
              onUpdateVehicle={handleUpdateVehicle}
              onDeleteVehicle={handleDeleteVehicle}
              onOpenTripLog={(vehId) => navigateTo({ isTripLog: true, isProfile: false, isAdding: false, vehicleId: vehId })}
            />
          ) : (
            /* VIEW D: STANDARD TAB VIEWS */
            <div className="animate-page-enter">
              {activeTab === 'dashboard' && (
                <DashboardView
                  vehicles={vehicles}
                  fuelLogs={fuelLogs}
                  spareParts={spareParts}
                  serviceRecords={serviceRecords}
                  onNavigateTab={(tab) => {
                    navigateTo({ tab, vehicleId: null, isAdding: false, isProfile: false });
                  }}
                  onOpenQuickScan={() => setIsScanModalOpen(true)}
                  onOpenAddFuel={(vehId) => {
                    if (vehicles.length === 0) {
                      navigateTo({ isAdding: true, isProfile: false, vehicleId: null });
                    } else {
                      setTargetVehicleIdForFuel(vehId);
                      setIsAddFuelOpen(true);
                    }
                  }}
                  onOpenAddService={(vehId) => {
                    if (vehicles.length === 0) {
                      navigateTo({ isAdding: true, isProfile: false, vehicleId: null });
                    } else {
                      setTargetVehicleIdForService(vehId);
                      setIsAddServiceOpen(true);
                    }
                  }}
                  onOpenAdjustFuel={(vehId) => handleOpenAdjustFuel(vehId)}
                  onOpenAiChat={handleOpenAiChatWithPrompt}
                  onNavigateToVehicle={(vehicleId) => {
                    navigateTo({ vehicleId, isProfile: false, isAdding: false });
                  }}
                  onOpenTripLog={() => navigateTo({ isTripLog: true, isProfile: false, isAdding: false, vehicleId: null })}
                />
              )}

              {activeTab === 'vehicles' && (
                <VehiclesView
                  vehicles={vehicles}
                  onAddVehicle={() => navigateTo({ isAdding: true, isProfile: false, vehicleId: null })}
                  onSelectVehicle={(veh) => navigateTo({ vehicleId: veh.id, isAdding: false, isProfile: false })}
                  onDeleteVehicle={handleDeleteVehicle}
                />
              )}

              {activeTab === 'fuel' && (
                <FuelView
                  vehicles={vehicles}
                  fuelLogs={fuelLogs}
                  onAddFuelLog={() => setIsAddFuelOpen(true)}
                  onOpenAdjustFuel={() => handleOpenAdjustFuel(undefined)}
                  onScanReceipt={() => setIsScanModalOpen(true)}
                />
              )}

              {activeTab === 'service' && (
                <ServiceView
                  vehicles={vehicles}
                  spareParts={spareParts}
                  serviceRecords={serviceRecords}
                  onAddService={() => setIsAddServiceOpen(true)}
                  onOpenAdjustPart={handleOpenAdjustPart}
                  onExportPdf={() => setIsPdfModalOpen(true)}
                  onUpdateService={handleUpdateServiceRecord}
                  onDeleteService={handleDeleteServiceRecord}
                />
              )}
            </div>
          )}
        </main>

        {/* Bottom Navigation (Mobile only, hidden on md) */}
        <BottomNav
          activeTab={activeTab}
          onChangeTab={(tab) => {
            navigateTo({ tab, isProfile: false, isAdding: false, vehicleId: null });
          }}
          serviceBadgeCount={criticalPartsCount}
          onOpenFleetMenu={() => setIsFleetMenuOpen(true)}
          isFleetMenuOpen={isFleetMenuOpen}
          onOpenQuickScan={() => setIsScanModalOpen(true)}
          onOpenAiSettings={() => setIsAiSettingsOpen(true)}
          onNewChat={handleNewChat}
          onOpenAiWithPrompt={handleOpenAiChatWithPrompt}
        />
      </div>

      {/* Notification Modal Dialog */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        vehicles={vehicles}
        spareParts={spareParts}
        userProfile={userProfile}
        readIds={readNotificationIds}
        onUpdateReadIds={(ids) => {
          setReadNotificationIds(ids);
          saveReadNotificationIds(ids);
        }}
        onNavigateToService={() => {
          navigateTo({ tab: 'service', isProfile: false, isAdding: false, vehicleId: null });
        }}
        onNavigateToVehicle={(vehicleId) => {
          navigateTo({ vehicleId, isProfile: false, isAdding: false });
        }}
        onNavigateToProfile={() => {
          navigateTo({ isProfile: true, isAdding: false, vehicleId: null });
        }}
        onNavigateToAi={(prompt) => {
          handleOpenAiChatWithPrompt(prompt);
        }}
      />

      {/* Modals & Dialogs */}
      <AiSettingsModal
        isOpen={isAiSettingsOpen}
        onClose={() => setIsAiSettingsOpen(false)}
        settings={aiSettings}
        onSaveSettings={(s) => setAiSettings(s)}
      />

      <ScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        vehicles={vehicles}
        onScanComplete={handleScanComplete}
      />

      <AddFuelModal
        isOpen={isAddFuelOpen}
        onClose={() => setIsAddFuelOpen(false)}
        vehicles={vehicles}
        onAddFuelLog={handleAddFuelLog}
        defaultVehicleId={targetVehicleIdForFuel || selectedVehicleIdForDetail || undefined}
      />

      <AdjustFuelModal
        isOpen={isAdjustFuelOpen}
        onClose={() => setIsAdjustFuelOpen(false)}
        vehicles={vehicles}
        fuelLogs={fuelLogs}
        onAddFuelLog={handleAddFuelLog}
        defaultVehicleId={targetVehicleIdForAdjustFuel || selectedVehicleIdForDetail || undefined}
      />

      <AdjustSparePartModal
        isOpen={isAdjustPartOpen}
        onClose={() => {
          setIsAdjustPartOpen(false);
          setSelectedPartForAdjust(null);
        }}
        part={selectedPartForAdjust}
        vehicle={vehicles.find((v) => v.id === selectedPartForAdjust?.vehicleId)}
        onUpdateSparePart={handleUpdateSparePart}
      />

      <AddServiceModal
        isOpen={isAddServiceOpen}
        onClose={() => setIsAddServiceOpen(false)}
        vehicles={vehicles}
        onAddService={handleAddServiceRecord}
        defaultVehicleId={targetVehicleIdForService || selectedVehicleIdForDetail || undefined}
      />

      <DigitalServicePdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        vehicles={vehicles}
        serviceRecords={serviceRecords}
        spareParts={spareParts}
      />

      <ThemeAccentModal
        isOpen={isThemeAccentModalOpen}
        onClose={() => setIsThemeAccentModalOpen(false)}
        currentAccent={accentTheme}
        onSelectAccent={(newAccent) => setAccentTheme(newAccent)}
      />

      <FleetMenuDrawer
        isOpen={isFleetMenuOpen}
        onClose={() => setIsFleetMenuOpen(false)}
        vehicles={vehicles}
        serviceBadgeCount={criticalPartsCount}
        onNavigateTab={(tab) => {
          navigateTo({ tab, isProfile: false, isAdding: false, vehicleId: null });
        }}
        onOpenTripLog={() => navigateTo({ isTripLog: true, isProfile: false, isAdding: false, vehicleId: null })}
        onOpenPredictiveBudget={() => setIsPredictiveBudgetOpen(true)}
        onOpenScanReceipt={() => setIsScanModalOpen(true)}
        onOpenAdjustFuel={() => handleOpenAdjustFuel(undefined)}
        onOpenServicePdf={() => setIsPdfModalOpen(true)}
        onOpenAiChat={handleOpenAiChatWithPrompt}
        onOpenInstallPwa={() => setIsInstallPwaOpen(true)}
      />

      <PredictiveBudgetModal
        isOpen={isPredictiveBudgetOpen}
        onClose={() => setIsPredictiveBudgetOpen(false)}
        vehicles={vehicles}
        spareParts={spareParts}
        serviceRecords={serviceRecords}
        fuelLogs={fuelLogs}
        defaultVehicleId={selectedVehicleIdForDetail || undefined}
      />

      {/* Floating Interactive PWA Install Prompt Banner */}
      <InstallPwaBanner
        onOpenDetailedModal={() => setIsInstallPwaOpen(true)}
      />

      {/* Comprehensive PWA Benefits & Install Guide Modal */}
      <InstallPwaModal
        isOpen={isInstallPwaOpen}
        onClose={() => setIsInstallPwaOpen(false)}
      />
    </div>
  );
}

export default App;
