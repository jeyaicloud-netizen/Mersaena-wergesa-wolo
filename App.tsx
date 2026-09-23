import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Phone, PhoneCall, PhoneIncoming, PhoneOutgoing, PhoneMissed, 
  Users, Clock, Search, Plus, 
  Mic, MicOff, Volume2, VolumeX, Disc, Delete
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  avatarColor: string;
  category?: 'Family' | 'Work' | 'Friends' | 'Services';
}

interface CallLog {
  id: string;
  contactName?: string;
  phoneNumber: string;
  type: 'incoming' | 'outgoing' | 'missed';
  timestamp: string;
  simSlot: 1 | 2;
  duration?: string;
}

interface SimConfig {
  id: 1 | 2;
  name: string;
  carrier: string;
  color: string;
  active: boolean;
}

interface ActiveCallState {
  contactName?: string;
  phoneNumber: string;
  simSlot: 1 | 2;
  status: 'connecting' | 'ringing' | 'connected' | 'ended';
  duration: number;
  isMuted: boolean;
  isSpeakerOn: boolean;
  isRecording: boolean;
}

const DTMF_FREQS: Record<string, [number, number]> = {
  '1': [697, 1209],
  '2': [697, 1336],
  '3': [697, 1477],
  '4': [770, 1209],
  '5': [770, 1336],
  '6': [770, 1477],
  '7': [852, 1209],
  '8': [852, 1336],
  '9': [852, 1477],
  '*': [941, 1209],
  '0': [941, 1336],
  '#': [941, 1477]
};

let audioCtx: AudioContext | null = null;
function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playDtmfTone(digit: string, duration = 0.12) {
  try {
    const freqs = DTMF_FREQS[digit];
    if (!freqs) return;
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.frequency.setValueAtTime(freqs[0], now);
    osc2.frequency.setValueAtTime(freqs[1], now);

    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  } catch {}
}

const initialContacts: Contact[] = [
  { id: '1', name: 'Commercial Bank of Ethiopia (CBE)', phoneNumber: '951', avatarColor: '#8B5CF6', category: 'Services' },
  { id: '2', name: 'Ethio Telecom Customer Service', phoneNumber: '994', avatarColor: '#F59E0B', category: 'Services' },
  { id: '3', name: 'Abebe Bikila', phoneNumber: '0911234567', avatarColor: '#10B981', category: 'Family' },
  { id: '4', name: 'Almaz Ayana', phoneNumber: '0922345678', avatarColor: '#3B82F6', category: 'Friends' },
  { id: '5', name: 'Federal Police Hotline', phoneNumber: '991', avatarColor: '#EF4444', category: 'Services' }
];

const initialCallLogs: CallLog[] = [
  { id: 'log-1', contactName: 'Commercial Bank of Ethiopia (CBE)', phoneNumber: '951', type: 'outgoing', timestamp: 'Today, 11:30 AM', simSlot: 1, duration: '45s' },
  { id: 'log-2', contactName: 'Abebe Bikila', phoneNumber: '0911234567', type: 'incoming', timestamp: 'Today, 2:15 PM', simSlot: 1, duration: '2m 14s' }
];

const defaultSims: SimConfig[] = [
  { id: 1, name: 'SIM 1', carrier: 'Ethio telecom', color: '#10B981', active: true },
  { id: 2, name: 'SIM 2', carrier: 'Safaricom ET', color: '#3B82F6', active: true }
];

export function App() {
  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      const s = localStorage.getItem('phone_contacts_v3');
      return s ? JSON.parse(s) : initialContacts;
    } catch { return initialContacts; }
  });

  const [callLogs, setCallLogs] = useState<CallLog[]>(() => {
    try {
      const s = localStorage.getItem('phone_logs_v3');
      return s ? JSON.parse(s) : initialCallLogs;
    } catch { return initialCallLogs; }
  });

  const [sims] = useState<SimConfig[]>(defaultSims);
  const [dialpadDigits, setDialpadDigits] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Missed'>('All');
  const [activeTab, setActiveTab] = useState<'recents' | 'contacts'>('recents');
  
  const [isNewContactOpen, setIsNewContactOpen] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  
  const [pendingCall, setPendingCall] = useState<{ number: string; name?: string } | null>(null);
  const [isSimDialogOpen, setIsSimDialogOpen] = useState(false);
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);
  
  const timerRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    try { localStorage.setItem('phone_contacts_v3', JSON.stringify(contacts)); } catch {}
  }, [contacts]);

  useEffect(() => {
    try { localStorage.setItem('phone_logs_v3', JSON.stringify(callLogs)); } catch {}
  }, [callLogs]);

  const stopAllAudio = () => {
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch {}
      currentAudioRef.current = null;
    }
  };

  const playSoundTrack = (filename: string) => {
    stopAllAudio();
    try {
      const audio = new Audio(`./${filename}`);
      audio.preload = 'auto';
      currentAudioRef.current = audio;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          const fallback = new Audio(`/${filename}`);
          fallback.play().catch(() => {});
          currentAudioRef.current = fallback;
        });
      }
    } catch {}
  };

  useEffect(() => {
    if (activeCall) {
      if (activeCall.status === 'ringing') {
        playSoundTrack('voice1.mp3');
      } else if (activeCall.status === 'connected') {
        playSoundTrack('voice2.mp3');
      } else if (activeCall.status === 'ended') {
        stopAllAudio();
      }
    } else {
      stopAllAudio();
    }
    return () => {
      stopAllAudio();
    };
  }, [activeCall?.status]);

  useEffect(() => {
    if (activeCall && activeCall.status === 'connected') {
      timerRef.current = setInterval(() => {
        setActiveCall(prev => prev ? { ...prev, duration: prev.duration + 1 } : null);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeCall?.status]);

  const handleKeyPress = (digit: string) => {
    getAudioContext();
    playDtmfTone(digit);
    setDialpadDigits(prev => prev + digit);
  };

  const handleInitiateCall = (number: string, name?: string) => {
    if (!number.trim()) return;
    getAudioContext();
    playDtmfTone('5');
    const activeSimsList = sims.filter(s => s.active);
    if (activeSimsList.length > 1) {
      setPendingCall({ number, name });
      setIsSimDialogOpen(true);
    } else {
      startCall(number, name, activeSimsList[0]?.id || 1);
    }
  };

  const startCall = (number: string, name: string | undefined, simId: 1 | 2) => {
    setIsSimDialogOpen(false);
    setPendingCall(null);
    const found = contacts.find(c => c.phoneNumber.replace(/\s+/g, '') === number.replace(/\s+/g, ''));
    const displayName = name || (found ? found.name : number);

    const newLog: CallLog = {
      id: Date.now().toString(),
      contactName: found ? found.name : undefined,
      phoneNumber: number,
      type: 'outgoing',
      timestamp: 'Just now',
      simSlot: simId,
      duration: '0s'
    };
    setCallLogs(prev => [newLog, ...prev]);

    setActiveCall({
      contactName: displayName,
      phoneNumber: number,
      simSlot: simId,
      status: 'connecting',
      duration: 0,
      isMuted: false,
      isSpeakerOn: false,
      isRecording: false
    });

    setTimeout(() => {
      setActiveCall(prev => prev ? { ...prev, status: 'ringing' } : null);
    }, 1500);

    setTimeout(() => {
      setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);
    }, 4500);
  };

  const handleEndCall = () => {
    stopAllAudio();
    playDtmfTone('#', 0.2);
    if (activeCall) {
      const durSec = activeCall.duration;
      const durStr = durSec > 60 ? `${Math.floor(durSec / 60)}m ${durSec % 60}s` : `${durSec}s`;
      setCallLogs(prev => prev.map((l, i) => i === 0 ? { ...l, duration: durStr } : l));
    }
    setActiveCall(null);
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;
    const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const c: Contact = {
      id: Date.now().toString(),
      name: newContactName.trim(),
      phoneNumber: newContactPhone.trim(),
      avatarColor: randomColor
    };
    setContacts(prev => [...prev, c]);
    setNewContactName('');
    setNewContactPhone('');
    setIsNewContactOpen(false);
  };

  const filteredLogs = useMemo(() => {
    let list = callLogs;
    if (activeFilter === 'Missed') list = list.filter(l => l.type === 'missed');
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(l => (l.contactName && l.contactName.toLowerCase().includes(q)) || l.phoneNumber.includes(q));
    }
    return list;
  }, [callLogs, activeFilter, searchQuery]);

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter(c => c.name.toLowerCase().includes(q) || c.phoneNumber.includes(q));
  }, [contacts, searchQuery]);

  return (
    <div className="fixed inset-0 w-full h-full bg-[#f8f9fa] flex flex-col font-sans text-slate-800 overflow-hidden select-none">
      
      {/* Top Mobile Status Header */}
      <div className="flex justify-between items-center px-4 py-2.5 bg-white border-b border-slate-100 text-xs font-semibold shrink-0">
        <span className="text-slate-600 font-bold">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold">ETHIO</span>
          <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold">SAFARICOM</span>
          <span className="text-slate-500 font-bold">4G</span>
        </div>
      </div>

      {/* Search Header */}
      <div className="p-3 bg-white border-b border-slate-100 flex items-center gap-2 shrink-0">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input 
            type="text"
            placeholder="Search contacts or numbers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 pl-9 pr-4 py-1.5 rounded-full text-sm outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <button 
          onClick={() => {
            setNewContactPhone(dialpadDigits);
            setIsNewContactOpen(true);
          }}
          className="p-2 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable List Area */}
      <div className="flex-1 overflow-y-auto pb-72">
        {activeTab === 'recents' ? (
          <div>
            <div className="flex gap-2 p-2 bg-white border-b border-slate-50">
              <button 
                onClick={() => setActiveFilter('All')}
                className={`px-4 py-1 rounded-full text-xs font-medium ${activeFilter === 'All' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                All Calls
              </button>
              <button 
                onClick={() => setActiveFilter('Missed')}
                className={`px-4 py-1 rounded-full text-xs font-medium ${activeFilter === 'Missed' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                Missed
              </button>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm">No recent calls</div>
            ) : (
              filteredLogs.map(log => (
                <div key={log.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-full bg-slate-100 text-slate-600">
                      {log.type === 'incoming' && <PhoneIncoming className="w-4 h-4 text-emerald-600" />}
                      {log.type === 'outgoing' && <PhoneOutgoing className="w-4 h-4 text-blue-600" />}
                      {log.type === 'missed' && <PhoneMissed className="w-4 h-4 text-red-500" />}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${log.type === 'missed' ? 'text-red-500' : 'text-slate-800'}`}>
                        {log.contactName || log.phoneNumber}
                      </p>
                      <p className="text-[11px] text-slate-400">{log.timestamp} • SIM {log.simSlot}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleInitiateCall(log.phoneNumber, log.contactName)}
                    className="p-2.5 bg-emerald-50 text-emerald-600 rounded-full active:scale-95"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div>
            {filteredContacts.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm">No contacts</div>
            ) : (
              filteredContacts.map(c => (
                <div key={c.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: c.avatarColor }}
                    >
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.phoneNumber}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleInitiateCall(c.phoneNumber, c.name)}
                    className="p-2.5 bg-emerald-50 text-emerald-600 rounded-full active:scale-95"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Dialpad Area at Bottom */}
      <div className="fixed bottom-14 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 pt-2 pb-3 shadow-lg z-20">
        <div className="flex justify-between items-center mb-1 px-4">
          <span className="text-xl font-bold text-slate-800 tracking-wider h-7">{dialpadDigits}</span>
          {dialpadDigits && (
            <button 
              onClick={() => {
                getAudioContext();
                playDtmfTone('0');
                setDialpadDigits(prev => prev.slice(0, -1));
              }}
              className="p-1 text-slate-400 hover:text-slate-700"
            >
              <Delete className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-1.5 max-w-[280px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(digit => (
            <button 
              key={digit}
              onClick={() => handleKeyPress(digit)}
              className="h-10 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 active:scale-95 text-base font-bold text-slate-700 shadow-sm"
            >
              {digit}
            </button>
          ))}
        </div>

        <div className="flex justify-center mt-2">
          <button 
            onClick={() => {
              if (dialpadDigits) handleInitiateCall(dialpadDigits);
            }}
            className="flex items-center gap-2 px-8 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold shadow-md shadow-emerald-500/30 active:scale-95 text-sm"
          >
            <PhoneCall className="w-4 h-4" /> Call
          </button>
        </div>
      </div>

      {/* Bottom Bar Navigation */}
      <div className="fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-slate-200 flex items-center justify-around z-30">
        <button 
          onClick={() => setActiveTab('recents')}
          className={`flex flex-col items-center gap-0.5 ${activeTab === 'recents' ? 'text-emerald-600' : 'text-slate-400'}`}
        >
          <Clock className="w-5 h-5" />
          <span className="text-[10px] font-bold">Recents</span>
        </button>
        <button 
          onClick={() => setActiveTab('contacts')}
          className={`flex flex-col items-center gap-0.5 ${activeTab === 'contacts' ? 'text-emerald-600' : 'text-slate-400'}`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-bold">Contacts</span>
        </button>
      </div>

      {/* SIM Selector Dialog */}
      {isSimDialogOpen && pendingCall && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-[300px] shadow-2xl">
            <h3 className="text-base font-bold text-slate-800 mb-1">Select SIM to Call</h3>
            <p className="text-xs text-slate-500 mb-4">{pendingCall.name || pendingCall.number}</p>
            <div className="flex flex-col gap-2">
              {sims.filter(s => s.active).map(s => (
                <button 
                  key={s.id}
                  onClick={() => startCall(pendingCall.number, pendingCall.name, s.id)}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-emerald-500 hover:bg-emerald-50"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-800">{s.carrier}</p>
                      <p className="text-[10px] text-slate-400">Slot {s.id}</p>
                    </div>
                  </div>
                  <Phone className="w-4 h-4 text-slate-400" />
                </button>
              ))}
            </div>
            <button 
              onClick={() => { setIsSimDialogOpen(false); setPendingCall(null); }}
              className="w-full mt-3 py-2 text-xs font-semibold text-slate-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Active In-Call Screen */}
      {activeCall && (
        <div className="fixed inset-0 bg-slate-900 text-white z-50 flex flex-col justify-between p-6">
          <div className="text-center pt-8">
            <p className="text-xs font-semibold text-emerald-400 mb-1">
              {activeCall.status === 'connecting' && 'Connecting...'}
              {activeCall.status === 'ringing' && 'Ringing...'}
              {activeCall.status === 'connected' && `${Math.floor(activeCall.duration / 60)}:${(activeCall.duration % 60).toString().padStart(2, '0')}`}
            </p>
            <h2 className="text-2xl font-bold mb-1">{activeCall.contactName || activeCall.phoneNumber}</h2>
            <p className="text-xs text-slate-400">{activeCall.phoneNumber} • SIM {activeCall.simSlot}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-[260px] mx-auto">
            <button 
              onClick={() => setActiveCall(p => p ? { ...p, isMuted: !p.isMuted } : null)}
              className={`p-3.5 rounded-full flex flex-col items-center gap-1 ${activeCall.isMuted ? 'bg-white text-slate-900' : 'bg-slate-800 text-white'}`}
            >
              {activeCall.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              <span className="text-[10px]">Mute</span>
            </button>
            <button 
              onClick={() => setActiveCall(p => p ? { ...p, isSpeakerOn: !p.isSpeakerOn } : null)}
              className={`p-3.5 rounded-full flex flex-col items-center gap-1 ${activeCall.isSpeakerOn ? 'bg-white text-slate-900' : 'bg-slate-800 text-white'}`}
            >
              <Volume2 className="w-5 h-5" />
              <span className="text-[10px]">Speaker</span>
            </button>
            <button 
              onClick={() => setActiveCall(p => p ? { ...p, isRecording: !p.isRecording } : null)}
              className={`p-3.5 rounded-full flex flex-col items-center gap-1 ${activeCall.isRecording ? 'bg-red-500 text-white' : 'bg-slate-800 text-white'}`}
            >
              <Disc className="w-5 h-5" />
              <span className="text-[10px]">Record</span>
            </button>
          </div>

          <div className="flex justify-center pb-8">
            <button 
              onClick={handleEndCall}
              className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white shadow-xl active:scale-95"
            >
              <Phone className="w-8 h-8 rotate-[135deg]" />
            </button>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {isNewContactOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveContact} className="bg-white rounded-2xl p-5 w-full max-w-[300px] shadow-2xl">
            <h3 className="text-base font-bold text-slate-800 mb-3">Add Contact</h3>
            <input 
              type="text" 
              placeholder="Name" 
              value={newContactName}
              onChange={e => setNewContactName(e.target.value)}
              required
              className="w-full p-2 mb-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
            />
            <input 
              type="tel" 
              placeholder="Number" 
              value={newContactPhone}
              onChange={e => setNewContactPhone(e.target.value)}
              required
              className="w-full p-2 mb-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
            />
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setIsNewContactOpen(false)}
                className="flex-1 py-1.5 text-xs font-semibold text-slate-500 bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-xl"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

export default App;
