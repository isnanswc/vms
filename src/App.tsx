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
import type { Vehicle, FuelLog, SparePart, ServiceRecord, TaxPaymentRecord } from './types';
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
import { AddServiceModal } from './components/AddServiceModal';
import { DigitalServicePdfModal } from './components/DigitalServicePdfModal';

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedVehicleIdForDetail, setSelectedVehicleIdForDetail] = useState<string | null>(null);
  const [isAddingVehiclePage, setIsAddingVehiclePage] = useState(false);
  const [isViewingProfile, setIsViewingProfile] = useState(false);

  // Application Data States (Persistent IndexedDB + LocalStorage)
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => loadInitialData('vehicles', INITIAL_VEHICLES));
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(() => loadInitialData('fuelLogs', INITIAL_FUEL_LOGS));
  const [spareParts, setSpareParts] = useState<SparePart[]>(() => loadInitialData('spareParts', INITIAL_SPAREPARTS));
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>(() => loadInitialData('serviceRecords', INITIAL_SERVICE_RECORDS));

  // User Profile & Multi-SIM state
  const [userProfile, setUserProfile] = useState<UserProfile>(() => loadInitialData('userProfile', INITIAL_USER_PROFILE));

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
  useEffect(() => { saveToStorage('chatSessions', chatSessions); }, [chatSessions]);
  useEffect(() => { saveToStorage('aiSettings', aiSettings); }, [aiSettings]);

  // Reconcile with IndexedDB on initial mount
  useEffect(() => {
    loadFromIndexedDB<Vehicle[]>('vehicles', INITIAL_VEHICLES).then((v) => {
      if (v && v.length > 0) setVehicles(v);
    });
  }, []);

  // Modal Dialog States
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isAddFuelOpen, setIsAddFuelOpen] = useState(false);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Handlers for Add Operations
  const handleSaveNewVehicleAndParts = (newVeh: Vehicle, newParts: SparePart[]) => {
    setVehicles([newVeh, ...vehicles]);
    setSpareParts([...newParts, ...spareParts]);
    setIsAddingVehiclePage(false);
    setSelectedVehicleIdForDetail(newVeh.id);
  };

  const handleUpdateVehicle = (updatedVehicle: Vehicle) => {
    setVehicles(vehicles.map((v) => (v.id === updatedVehicle.id ? updatedVehicle : v)));
  };

  const handleAddFuelLog = (newLog: FuelLog) => {
    setFuelLogs([newLog, ...fuelLogs]);
    setVehicles(vehicles.map((v) => 
      v.id === newLog.vehicleId && newLog.odometerKm > v.currentOdometerKm
        ? { ...v, currentOdometerKm: newLog.odometerKm }
        : v
    ));
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
    setVehicles(vehicles.map((v) => 
      v.id === result.vehicleId 
        ? { ...v, currentOdometerKm: result.detectedKm }
        : v
    ));

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
        efficiencyKmPerLiter: 42.0,
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
  const urgentCount = criticalPartsCount + 1;

  // Selected vehicle for detail view
  const currentDetailVehicle = vehicles.find((v) => v.id === selectedVehicleIdForDetail);

  // Unified Navigation & Browser History Back Management
  const navigateTo = (options: {
    tab?: TabType;
    vehicleId?: string | null;
    isAdding?: boolean;
    isProfile?: boolean;
  }) => {
    if (options.tab !== undefined) setActiveTab(options.tab);
    if (options.vehicleId !== undefined) setSelectedVehicleIdForDetail(options.vehicleId);
    if (options.isAdding !== undefined) setIsAddingVehiclePage(options.isAdding);
    if (options.isProfile !== undefined) setIsViewingProfile(options.isProfile);

    if (typeof window !== 'undefined') {
      window.history.pushState(
        {
          tab: options.tab !== undefined ? options.tab : activeTab,
          vehicleId: options.vehicleId !== undefined ? options.vehicleId : selectedVehicleIdForDetail,
          isAdding: options.isAdding !== undefined ? options.isAdding : isAddingVehiclePage,
          isProfile: options.isProfile !== undefined ? options.isProfile : isViewingProfile,
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
      } else {
        setIsViewingProfile(false);
        setIsAddingVehiclePage(false);
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
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex font-sans">
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
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 bg-white min-h-screen relative">
        {/* Top Fleet Header */}
        <Header
          urgentCount={urgentCount}
          profile={userProfile}
          onOpenAlerts={() => {
            navigateTo({ tab: 'service', isProfile: false, isAdding: false, vehicleId: null });
          }}
          onOpenProfile={() => {
            navigateTo({ isProfile: true, isAdding: false, vehicleId: null });
          }}
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
          ) : selectedVehicleIdForDetail && currentDetailVehicle ? (
            /* VIEW C: VEHICLE DETAIL (INFO & PAJAK, BBM, SPAREPART) */
            <VehicleDetailView
              vehicle={currentDetailVehicle}
              fuelLogs={fuelLogs}
              spareParts={spareParts}
              serviceRecords={serviceRecords}
              onBack={handleGoBack}
              onAddFuelLog={() => setIsAddFuelOpen(true)}
              onAddService={() => setIsAddServiceOpen(true)}
              onOpenAiChat={handleOpenAiChatWithPrompt}
              onAddTaxPayment={handleAddTaxPayment}
              onUpdateVehicle={handleUpdateVehicle}
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
                  onOpenAddFuel={() => setIsAddFuelOpen(true)}
                  onOpenAiChat={handleOpenAiChatWithPrompt}
                />
              )}

              {activeTab === 'vehicles' && (
                <VehiclesView
                  vehicles={vehicles}
                  onAddVehicle={() => navigateTo({ isAdding: true, isProfile: false, vehicleId: null })}
                  onSelectVehicle={(veh) => navigateTo({ vehicleId: veh.id, isAdding: false, isProfile: false })}
                />
              )}

              {activeTab === 'fuel' && (
                <FuelView
                  vehicles={vehicles}
                  fuelLogs={fuelLogs}
                  onAddFuelLog={() => setIsAddFuelOpen(true)}
                  onScanReceipt={() => setIsScanModalOpen(true)}
                />
              )}

              {activeTab === 'service' && (
                <ServiceView
                  vehicles={vehicles}
                  spareParts={spareParts}
                  serviceRecords={serviceRecords}
                  onAddService={() => setIsAddServiceOpen(true)}
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
        />
      </div>

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
        defaultVehicleId={selectedVehicleIdForDetail || undefined}
      />

      <AddServiceModal
        isOpen={isAddServiceOpen}
        onClose={() => setIsAddServiceOpen(false)}
        vehicles={vehicles}
        onAddService={handleAddServiceRecord}
      />

      <DigitalServicePdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        vehicles={vehicles}
        serviceRecords={serviceRecords}
        spareParts={spareParts}
      />
    </div>
  );
}

export default App;
