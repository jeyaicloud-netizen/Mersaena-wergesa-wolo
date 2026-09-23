import { useState, useEffect, useRef, useMemo } from 'react';
import { Contact, CallLog, SimConfig, ActiveCallState } from './types';
import { INITIAL_CONTACTS, INITIAL_CALL_LOGS, INITIAL_SIMS } from './data/initialData';
import StatusBar from './components/StatusBar';
import SearchHeader from './components/SearchHeader';
import CallHistoryList from './components/CallHistoryList';
import DialpadSheet from './components/DialpadSheet';
import SimSelectionDialog from './components/SimSelectionDialog';
import InCallScreen from './components/InCallScreen';
import NavigationDrawer from './components/NavigationDrawer';
import NewContactModal from './components/NewContactModal';
import ContactsModal from './components/ContactsModal';
import SettingsModal from './components/SettingsModal';
import HelpModal from './components/HelpModal';
import BottomNavBar from './components/BottomNavBar';
import { playEndCallTone, triggerHaptic } from './utils/audio';

export default function App() {
  // State: Contacts, Call Logs, SIMs
  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      const saved = localStorage.getItem('phone_app_contacts');
      return saved ? JSON.parse(saved) : INITIAL_CONTACTS;
    } catch {
      return INITIAL_CONTACTS;
    }
  });

  const [callLogs, setCallLogs] = useState<CallLog[]>(() => {
    try {
      const saved = localStorage.getItem('phone_app_call_logs');
      return saved ? JSON.parse(saved) : INITIAL_CALL_LOGS;
    } catch {
      return INITIAL_CALL_LOGS;
    }
  });

  const [sims, setSims] = useState<SimConfig[]>(() => {
    try {
      const saved = localStorage.getItem('phone_app_sims');
      return saved ? JSON.parse(saved) : INITIAL_SIMS;
    } catch {
      return INITIAL_SIMS;
    }
  });

  // Navigation & View tabs
  const [currentTab, setCurrentTab] = useState<'home' | 'keypad'>('home');
  const [dialpadDigits, setDialpadDigits] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Modals & Sheets
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);
  const [isNewContactModalOpen, setIsNewContactModalOpen] = useState(false);
  const [newContactInitialNumber, setNewContactInitialNumber] = useState('');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Settings
  const [showStatusBar, setShowStatusBar] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  // Active Calling
  const [pendingCall, setPendingCall] = useState<{ number: string; name?: string } | null>(null);
  const [isSimDialogOpen, setIsSimDialogOpen] = useState(false);
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Persist contacts, call logs, sims to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('phone_app_contacts', JSON.stringify(contacts));
    } catch {
      // ignore
    }
  }, [contacts]);

  useEffect(() => {
    try {
      localStorage.setItem('phone_app_call_logs', JSON.stringify(callLogs));
    } catch {
      // ignore
    }
  }, [callLogs]);

  useEffect(() => {
    try {
      localStorage.setItem('phone_app_sims', JSON.stringify(sims));
    } catch {
      // ignore
    }
  }, [sims]);

  // Active call duration timer
  useEffect(() => {
    if (activeCall && activeCall.status === 'connected') {
      callTimerRef.current = setInterval(() => {
        setActiveCall((prev) => (prev ? { ...prev, seconds: prev.seconds + 1 } : null));
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    }
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    };
  }, [activeCall?.status]);

  // Handle Call Initiation (Opens SIM Dialog - Screenshot 3)
  const handleInitiateCall = (number: string, name?: string) => {
    if (!number.trim()) return;
    setPendingCall({ number: number.trim(), name: name?.trim() });
    setIsSimDialogOpen(true);
  };

  // Handle SIM Selection & Start Call
  const handleSelectSim = (simId: number) => {
    if (!pendingCall) return;
    const selectedSim = sims.find((s) => s.id === simId) || sims[0];
    setIsSimDialogOpen(false);

    if (vibrationEnabled) triggerHaptic(25);

    // Create call state
    const newCall: ActiveCallState = {
      number: pendingCall.number,
      name: pendingCall.name,
      carrier: selectedSim.name,
      status: 'calling',
      seconds: 0,
      isMuted: false,
      isSpeaker: false,
      isRecording: true, // Auto-recording enabled as seen in screenshots with red dot
      recordingSavedToast: false,
      inCallKeypadOpen: false,
      simId,
    };
    setActiveCall(newCall);

    // Save outgoing call to call history
    const newLog: CallLog = {
      id: 'log_' + Date.now(),
      number: pendingCall.number,
      name: pendingCall.name,
      direction: 'outgoing',
      timestamp: 'Just now',
      timeAgo: 'Just now',
      dateGroup: 'Today',
      carrier: selectedSim.name,
      hasRecording: true,
    };

    setCallLogs((prev) => [newLog, ...prev]);

    // Simulate connection after 1.8 seconds
    setTimeout(() => {
      setActiveCall((prev) => (prev ? { ...prev, status: 'connected' } : null));
    }, 1800);

    setPendingCall(null);
  };

  // Handle End Call
  const handleEndCall = () => {
    if (!activeCall) return;
    if (soundEnabled) playEndCallTone();
    if (vibrationEnabled) triggerHaptic(30);

    const wasRecording = activeCall.isRecording;

    if (wasRecording) {
      // Show "Recording saved." toast for 2.5 seconds (Screenshot 8)
      setActiveCall((prev) =>
        prev ? { ...prev, recordingSavedToast: true, status: 'ended' } : null
      );
      setTimeout(() => {
        setActiveCall(null);
      }, 2400);
    } else {
      setActiveCall(null);
    }
  };

  // In-call toggles
  const handleToggleMute = () => {
    if (vibrationEnabled) triggerHaptic(15);
    setActiveCall((prev) => (prev ? { ...prev, isMuted: !prev.isMuted } : null));
  };

  const handleToggleSpeaker = () => {
    if (vibrationEnabled) triggerHaptic(15);
    setActiveCall((prev) => (prev ? { ...prev, isSpeaker: !prev.isSpeaker } : null));
  };

  const handleToggleRecord = () => {
    if (vibrationEnabled) triggerHaptic(15);
    setActiveCall((prev) => {
      if (!prev) return null;
      const willBeRecording = !prev.isRecording;
      return {
        ...prev,
        isRecording: willBeRecording,
        recordingSavedToast: !willBeRecording, // show toast when stopped
      };
    });

    // Auto-dismiss toast
    setTimeout(() => {
      setActiveCall((prev) => (prev ? { ...prev, recordingSavedToast: false } : null));
    }, 2400);
  };

  const handleToggleInCallKeypad = () => {
    if (vibrationEnabled) triggerHaptic(15);
    setActiveCall((prev) =>
      prev ? { ...prev, inCallKeypadOpen: !prev.inCallKeypadOpen } : null
    );
  };

  // Contacts management
  const handleSaveNewContact = (newContact: Omit<Contact, 'id'>) => {
    const contact: Contact = {
      ...newContact,
      id: 'c_' + Date.now(),
    };
    setContacts((prev) => [contact, ...prev]);
  };

  const handleDeleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const handleDeleteLog = (id: string) => {
    setCallLogs((prev) => prev.filter((l) => l.id !== id));
  };

  const handleClearCallHistory = () => {
    if (confirm('Clear all call history?')) {
      setCallLogs([]);
    }
  };

  const handleResetData = () => {
    setContacts(INITIAL_CONTACTS);
    setCallLogs(INITIAL_CALL_LOGS);
    setSims(INITIAL_SIMS);
    localStorage.removeItem('phone_app_contacts');
    localStorage.removeItem('phone_app_call_logs');
    localStorage.removeItem('phone_app_sims');
  };

  const handleOpenCreateContactWithNumber = (num: string) => {
    setNewContactInitialNumber(num);
    setIsNewContactModalOpen(true);
  };

  // Filtered Call Logs
  const filteredCallLogs = useMemo(() => {
    return callLogs.filter((log) => {
      // Filter by category chip
      if (activeFilter === 'Missed' && log.direction !== 'missed') return false;
      if (activeFilter === 'Contacts') {
        const hasContact = contacts.some(
          (c) => c.number === log.number || c.name === log.name
        );
        if (!hasContact) return false;
      }
      if (activeFilter === 'Spam') return false; // none by default

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNumber = log.number.includes(q);
        const matchesName = log.name?.toLowerCase().includes(q);
        if (!matchesNumber && !matchesName) return false;
      }

      return true;
    });
  }, [callLogs, contacts, activeFilter, searchQuery]);

  return (
    <div className="w-full min-h-screen bg-[#EAE8F2] flex items-center justify-center font-sans md:py-3 select-none">
      {/* Phone container: full width/height in mobile & WebView, responsive frame on desktop */}
      <div className="w-full h-full min-h-[100dvh] md:h-[92vh] md:max-w-[430px] md:rounded-[42px] bg-[#F2F1F6] flex flex-col justify-between relative overflow-hidden shadow-2xl md:border-[7px] md:border-[#222129]">
        
        {/* Status Bar (Toggleable for native Android WebView) */}
        {showStatusBar && (
          <StatusBar onToggleSettings={() => setIsSettingsModalOpen(true)} />
        )}

        {/* Top Header with Search and Filter Chips (Visible on Home tab) */}
        {currentTab === 'home' && (
          <SearchHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeFilter={activeFilter}
            onSelectFilter={setActiveFilter}
            onOpenDrawer={() => setIsDrawerOpen(true)}
          />
        )}

        {/* Main Content View */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {currentTab === 'home' ? (
            /* Home Tab: Recent Call History */
            <CallHistoryList
              callLogs={filteredCallLogs}
              contacts={contacts}
              onStartCall={handleInitiateCall}
              onOpenContacts={() => setIsContactsModalOpen(true)}
              onDeleteLog={handleDeleteLog}
              onCreateContactFromNumber={handleOpenCreateContactWithNumber}
            />
          ) : (
            /* Keypad Tab: Suggested or Dialed display + Dialpad */
            <DialpadSheet
              digits={dialpadDigits}
              onDigitsChange={setDialpadDigits}
              contacts={contacts}
              onInitiateCall={handleInitiateCall}
              onCreateNewContact={handleOpenCreateContactWithNumber}
              soundEnabled={soundEnabled}
              vibrationEnabled={vibrationEnabled}
            />
          )}
        </div>

        {/* Bottom Navigation Bar */}
        <BottomNavBar
          currentTab={currentTab}
          onTabChange={(tab) => {
            if (vibrationEnabled) triggerHaptic(10);
            setCurrentTab(tab);
          }}
        />

        {/* Dual SIM Selector Dialog - Screenshot 3 */}
        <SimSelectionDialog
          isOpen={isSimDialogOpen}
          onClose={() => setIsSimDialogOpen(false)}
          onSelectSim={handleSelectSim}
          sims={sims}
          targetNumber={pendingCall?.number || ''}
          targetName={pendingCall?.name}
        />

        {/* Fullscreen In-Call View - Screenshots 4, 5, 6, 8 */}
        {activeCall && (
          <InCallScreen
            call={activeCall}
            onEndCall={handleEndCall}
            onToggleMute={handleToggleMute}
            onToggleSpeaker={handleToggleSpeaker}
            onToggleRecord={handleToggleRecord}
            onToggleInCallKeypad={handleToggleInCallKeypad}
            soundEnabled={soundEnabled}
            vibrationEnabled={vibrationEnabled}
          />
        )}

        {/* Navigation Drawer - Screenshot 10 */}
        <NavigationDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onOpenContacts={() => setIsContactsModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onClearCallHistory={handleClearCallHistory}
          onOpenHelp={() => setIsHelpModalOpen(true)}
        />

        {/* New Contact Creation Modal */}
        <NewContactModal
          isOpen={isNewContactModalOpen}
          initialNumber={newContactInitialNumber}
          onClose={() => {
            setIsNewContactModalOpen(false);
            setNewContactInitialNumber('');
          }}
          onSave={handleSaveNewContact}
        />

        {/* Contacts Explorer Modal */}
        <ContactsModal
          isOpen={isContactsModalOpen}
          onClose={() => setIsContactsModalOpen(false)}
          contacts={contacts}
          onStartCall={handleInitiateCall}
          onOpenCreateContact={() => {
            setNewContactInitialNumber('');
            setIsNewContactModalOpen(true);
          }}
          onDeleteContact={handleDeleteContact}
        />

        {/* Settings Modal */}
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          showStatusBar={showStatusBar}
          onToggleStatusBar={setShowStatusBar}
          soundEnabled={soundEnabled}
          onToggleSound={setSoundEnabled}
          vibrationEnabled={vibrationEnabled}
          onToggleVibration={setVibrationEnabled}
          sims={sims}
          onUpdateSims={setSims}
          onResetData={handleResetData}
        />

        {/* Help & Android WebView / Vercel Guidance Modal */}
        <HelpModal
          isOpen={isHelpModalOpen}
          onClose={() => setIsHelpModalOpen(false)}
        />
      </div>
    </div>
  );
}
