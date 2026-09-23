import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, PhoneCall, PhoneIncoming, PhoneOutgoing, PhoneMissed, 
  Mic, MicOff, Volume2, Delete, MoreVertical, LayoutGrid, Clock, User
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  avatarColor: string;
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

const DTMF_FREQS: Record<string, [number, number]> = {
  '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
  '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
  '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
  '*': [941, 1209], '0': [941, 1336], '#': [941, 1477]
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
  { id: '1', name: 'Commercial Bank of Ethiopia (CBE)', phoneNumber: '951', avatarColor: '#8B5CF6' },
  { id: '2', name: 'Ethio Telecom Customer Service', phoneNumber: '994', avatarColor: '#F59E0B' },
  { id: '3', name: 'Abebe Bikila', phoneNumber: '0911234567', avatarColor: '#10B981' },
  { id: '4', name: 'Almaz Ayana', phoneNumber: '0922345678', avatarColor: '#3B82F6' },
  { id: '5', name: 'Federal Police Hotline', phoneNumber: '991', avatarColor: '#EF4444' }
];

const initialCallLogs: CallLog[] = [
  { id: 'log-1', contactName: 'Commercial Bank of Ethiopia (CBE)', phoneNumber: '951', type: 'outgoing', timestamp: 'Just now', simSlot: 1, duration: '45s' },
  { id: 'log-2', contactName: 'Abebe Bikila', phoneNumber: '0911234567', type: 'incoming', timestamp: 'Today, 2:15 PM', simSlot: 1, duration: '2m 14s' }
];

export function App() {
  const [contacts] = useState<Contact[]>(initialContacts);
  const [callLogs, setCallLogs] = useState<CallLog[]>(initialCallLogs);
  const [dialpadDigits, setDialpadDigits] = useState('');
  const [activeTab, setActiveTab] = useState<'home' | 'keypad'>('home');
  const [filter, setFilter] = useState<'All' | 'Missed' | 'Contacts'>('All');
  
  const [activeCall, setActiveCall] = useState<{
    contactName?: string;
    phoneNumber: string;
    status: 'ringing' | 'connected';
    duration: number;
    isMuted: boolean;
    isSpeakerOn: boolean;
    isKeypadOpen: boolean;
  } | null>(null);

  const [inCallKeypadDigits, setInCallKeypadDigits] = useState('');
  const timerRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

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
      currentAudioRef.current = audio;
      audio.play().catch(() => {
        const fallback = new Audio(`/${filename}`);
        fallback.play().catch(() => {});
        currentAudioRef.current = fallback;
      });
    } catch {}
  };

  useEffect(() => {
    if (activeCall) {
      if (activeCall.status === 'ringing') {
        playSoundTrack('voice1.mp3');
      } else if (activeCall.status === 'connected') {
        playSoundTrack('voice2.mp3');
      }
    } else {
      stopAllAudio();
    }
    return () => { stopAllAudio(); };
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
    if (activeCall?.isKeypadOpen) {
      setInCallKeypadDigits(prev => prev + digit);
    } else {
      setDialpadDigits(prev => prev + digit);
    }
  };

  const handleInitiateCall = (number: string, name?: string) => {
    if (!number.trim()) return;
    getAudioContext();
    playDtmfTone('5');
    const found = contacts.find(c => c.phoneNumber.replace(/\s+/g, '') === number.replace(/\s+/g, ''));
    const displayName = name || (found ? found.name : undefined);

    setCallLogs(prev => [{
      id: Date.now().toString(),
      contactName: displayName,
      phoneNumber: number,
      type: 'outgoing',
      timestamp: 'Just now',
      simSlot: 1
    }, ...prev]);

    setActiveCall({
      contactName: displayName,
      phoneNumber: number,
      status: 'ringing',
      duration: 0,
      isMuted: false,
      isSpeakerOn: false,
      isKeypadOpen: false
    });

    setTimeout(() => {
      setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);
    }, 4000);
  };

  const handleEndCall = () => {
    stopAllAudio();
    playDtmfTone('#', 0.2);
    setActiveCall(null);
  };

  const keyDetails: Record<string, string> = {
    '1': 'oo', '2': 'ABC', '3': 'DEF',
    '4': 'GHI', '5': 'JKL', '6': 'MNO',
    '7': 'PQRS', '8': 'TUV', '9': 'WXYZ',
    '*': '', '0': '+', '#': ''
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-[#f8f9fc] flex flex-col font-sans text-slate-800 select-none overflow-hidden">
      
      {/* Top Search Bar (Google Pixel Style) */}
      <div className="p-3.5 bg-[#f8f9fc] shrink-0">
        <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2.5 shadow-sm border border-slate-100">
          <button className="text-slate-600">
            <div className="w-4 h-0.5 bg-slate-700 mb-1 rounded-full"></div>
            <div className="w-4 h-0.5 bg-slate-700 mb-1 rounded-full"></div>
            <div className="w-4 h-0.5 bg-slate-700 rounded-full"></div>
          </button>
          <span className="flex-1 text-slate-500 text-sm font-medium">Search contacts</span>
          <Mic className="w-4 h-4 text-slate-600" />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
          {(['All', 'Missed', 'Contacts'] as const).map(chip => (
            <button
              key={chip}
              onClick={() => setFilter(chip)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filter === chip ? 'bg-[#d8e2ff] text-[#001a41]' : 'bg-[#e9eef6] text-slate-600'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 pb-48">
        {filter === 'Contacts' ? (
          <div className="space-y-2">
            {contacts.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3.5 bg-white rounded-2xl shadow-sm border border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: c.avatarColor }}>
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.phoneNumber}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleInitiateCall(c.phoneNumber, c.name)}
                  className="p-2.5 bg-[#e8f0fe] text-blue-600 rounded-full active:scale-95"
                >
                  <Phone className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center py-2 text-xs font-semibold text-slate-500">
              <span>Favourites</span>
              <span className="text-blue-600 font-bold">View contacts</span>
            </div>
            <p className="text-xs font-bold text-slate-500 mb-2">Today</p>

            <div className="space-y-2.5">
              {callLogs
                .filter(l => filter === 'All' || (filter === 'Missed' && l.type === 'missed'))
                .map(log => (
                  <div key={log.id} className="flex items-center justify-between p-3.5 bg-white rounded-2xl shadow-sm border border-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#f1f3f9] flex items-center justify-center text-slate-600">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-slate-900">{log.contactName || log.phoneNumber}</p>
                          <Mic className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <p className="text-[11px] text-slate-400">↗ {log.timestamp}</p>
                        <p className="text-[11px] font-bold text-emerald-600">Ethio telecom</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleInitiateCall(log.phoneNumber, log.contactName)}
                      className="p-2.5 text-slate-600 hover:bg-slate-50 rounded-full active:scale-95"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Dialpad Popup */}
      {activeTab === 'keypad' && (
        <div className="fixed bottom-16 left-0 right-0 bg-[#f3f4fa] rounded-t-[32px] p-4 shadow-2xl border-t border-slate-200 z-30 animate-in slide-in-from-bottom duration-200">
          <div className="flex justify-between items-center mb-2 px-6">
            <span className="text-2xl font-bold text-slate-900 tracking-wider h-8">{dialpadDigits}</span>
            {dialpadDigits && (
              <button 
                onClick={() => {
                  getAudioContext();
                  playDtmfTone('0');
                  setDialpadDigits(prev => prev.slice(0, -1));
                }}
                className="p-1 text-slate-500"
              >
                <Delete className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 max-w-[320px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(digit => (
              <button 
                key={digit}
                onClick={() => handleKeyPress(digit)}
                className="h-14 rounded-full bg-white hover:bg-slate-50 active:bg-[#d8e2ff] active:scale-95 flex flex-col items-center justify-center shadow-sm"
              >
                <span className="text-xl font-bold text-slate-800 leading-none">{digit}</span>
                {keyDetails[digit] && (
                  <span className="text-[9px] font-bold text-slate-400 tracking-widest mt-0.5">{keyDetails[digit]}</span>
                )}
              </button>
            ))}
          </div>

          <div className="flex justify-center mt-3">
            <button 
              onClick={() => {
                if (dialpadDigits) handleInitiateCall(dialpadDigits);
              }}
              className="flex items-center justify-center gap-2 px-10 py-3 bg-[#1e8e3e] hover:bg-emerald-700 text-white rounded-full font-bold shadow-lg active:scale-95 text-base"
            >
              <PhoneCall className="w-5 h-5" /> Call
            </button>
          </div>
        </div>
      )}

      {/* Bottom Material You Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-[#f3f4fa] border-t border-slate-200 flex items-center justify-around z-40">
        <button 
          onClick={() => setActiveTab('home')}
          className="flex flex-col items-center gap-1"
        >
          <div className={`px-5 py-1 rounded-full transition-colors ${activeTab === 'home' ? 'bg-[#d8e2ff] text-[#001a41]' : 'text-slate-600'}`}>
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-slate-700">Home</span>
        </button>

        <button 
          onClick={() => setActiveTab('keypad')}
          className="flex flex-col items-center gap-1"
        >
          <div className={`px-5 py-1 rounded-full transition-colors ${activeTab === 'keypad' ? 'bg-[#d8e2ff] text-[#001a41]' : 'text-slate-600'}`}>
            <LayoutGrid className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold text-slate-700">Keypad</span>
        </button>
      </div>

      {/* Google In-Call Screen (Pure White UI) */}
      {activeCall && (
        <div className="fixed inset-0 bg-[#f8f9fe] text-slate-900 z-50 flex flex-col justify-between p-6">
          <div className="text-center pt-10">
            <p className="text-xs font-semibold text-red-500 mb-2 flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              {activeCall.status === 'ringing' ? 'Ringing...' : `${Math.floor(activeCall.duration / 60).toString().padStart(2, '0')} : ${(activeCall.duration % 60).toString().padStart(2, '0')}`}
            </p>
            <h2 className="text-3xl font-bold text-slate-900 mb-1">{activeCall.phoneNumber}</h2>
            {activeCall.contactName && (
              <p className="text-base font-medium text-slate-600">{activeCall.contactName}</p>
            )}
            <p className="text-xs font-bold text-emerald-600 mt-2">Ethio telecom</p>
          </div>

          {/* In-Call Keypad Overlay if open */}
          {activeCall.isKeypadOpen && (
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-4 shadow-xl border border-slate-100 max-w-[320px] mx-auto w-full">
              <div className="flex justify-between items-center mb-2 px-4">
                <span className="text-lg font-bold">{inCallKeypadDigits}</span>
                <button onClick={() => setActiveCall(p => p ? { ...p, isKeypadOpen: false } : null)} className="text-xs font-bold text-slate-500">
                  Close
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(digit => (
                  <button 
                    key={digit}
                    onClick={() => handleKeyPress(digit)}
                    className="h-10 rounded-xl bg-slate-100 active:bg-slate-200 text-sm font-bold text-slate-800"
                  >
                    {digit}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom In-Call Controls */}
          <div className="pb-8">
            <div className="grid grid-cols-4 gap-3 max-w-[320px] mx-auto mb-8">
              <button 
                onClick={() => setActiveCall(p => p ? { ...p, isKeypadOpen: !p.isKeypadOpen } : null)}
                className={`p-4 rounded-full flex flex-col items-center gap-1.5 shadow-sm transition-all ${
                  activeCall.isKeypadOpen ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'
                }`}
              >
                <LayoutGrid className="w-5 h-5" />
                <span className="text-[10px] font-bold">Keypad</span>
              </button>

              <button 
                onClick={() => setActiveCall(p => p ? { ...p, isMuted: !p.isMuted } : null)}
                className={`p-4 rounded-full flex flex-col items-center gap-1.5 shadow-sm transition-all ${
                  activeCall.isMuted ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'
                }`}
              >
                {activeCall.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                <span className="text-[10px] font-bold">Mute</span>
              </button>

              <button 
                onClick={() => setActiveCall(p => p ? { ...p, isSpeakerOn: !p.isSpeakerOn } : null)}
                className={`p-4 rounded-full flex flex-col items-center gap-1.5 shadow-sm transition-all ${
                  activeCall.isSpeakerOn ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'
                }`}
              >
                <Volume2 className="w-5 h-5" />
                <span className="text-[10px] font-bold">Speaker</span>
              </button>

              <button 
                className="p-4 rounded-full bg-white text-slate-700 flex flex-col items-center gap-1.5 shadow-sm"
              >
                <MoreVertical className="w-5 h-5" />
                <span className="text-[10px] font-bold">More</span>
              </button>
            </div>

            {/* End Call Button */}
            <div className="flex justify-center">
              <button 
                onClick={handleEndCall}
                className="w-16 h-16 bg-[#d93025] rounded-full flex items-center justify-center text-white shadow-xl active:scale-95"
              >
                <Phone className="w-7 h-7 rotate-[135deg]" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
