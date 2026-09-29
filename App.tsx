import React, { useState, useEffect, useRef } from 'react';
import {
  PhoneCall,
  PhoneOff,
  Delete,
  Mic,
  Volume2,
  Building2,
  Send,
  Sparkles,
  Headphones,
  Activity,
  Play
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'agent' | 'user';
  text: string;
  time: string;
}

const BANKING_STEPS = [
  {
    stepIndex: 0,
    agentText: "ሰላም ጤና ይስጥልኝ ከኢትዮጵያ ንግድ ባንክ ነው፤ እባክዎት ምን ልርዳዎት?",
    quickReplies: [
      "ገንዘብ ልኬ ነበር ግን ለሰውየው አልደረሰም",
      "ብር አስተላልፌ ነበር ግን መልዕክት አልደረሰውም",
      "ስለተላከ ብር ላጣራ ነበር"
    ],
    agentStatus: "ይስሀቅ መስመር ላይ ነው • እርስዎን በማዳመጥ ላይ"
  },
  {
    stepIndex: 1,
    agentText: "እሺ ደንበኛችን፤ ለመሆኑ ገንዘቡን ከየትኛው አካውንት ነው የላኩት? ወይስ ከእርስዎ የሲቢኢ ብር አካውንት ነው?",
    quickReplies: [
      "ከራሴ የሲቢኢ ብር (CBE Birr) አካውንት ነው የላኩት",
      "ከመደበኛ የባንክ ሂሳብ ቁጥሬ ነው",
      "በሞባይል ባንኪንግ ነው የላኩት"
    ],
    agentStatus: "ይስሀቅ የአካውንት አይነት እየጠየቀ ነው"
  },
  {
    stepIndex: 2,
    agentText: "እሺ አዳምጬ ተረድቻለሁ፤ እባክዎ የተላከለት ሰው የአካውንት ስም እና የአካውንት ቁጥር ይንገሩኝ?",
    quickReplies: [
      "አካውንት ቁጥር 100023456789፤ ስሙ አበበ ከበደ",
      "አካውንት 100098765432፤ ስሟ ትዕግስት ኃይሉ",
      "ስልኩ 0911223344፤ ስሙ ተስፋዬ በቀለ"
    ],
    agentStatus: "ይስሀቅ የተቀባይ መረጃ በመጠየቅ ላይ..."
  },
  {
    stepIndex: 3,
    agentText: "እሺ በሲስተማችን ቼክ እያደረግሁ ነው... አዎ! ግብይቱን እያየሁት ነው፤ በሲስተም መዘግየት ምክንያት ነው መልዕክቱ ያልደረሰው። በ24 ሰዓት ውስጥ ለተላከለት ሰው ሙሉ በሙሉ ይደርሳል!",
    quickReplies: [
      "እሺ በጣም አመሰግናለሁ፤ ሌላ ጥያቄ የለኝም",
      "እሺ ይደርሳል ካሉኝ እጠብቃለሁ መልካም ቀን",
      "በጣም አመሰግናለሁ ሰላም ሁኑ"
    ],
    agentStatus: "በሲስተም ቼክ ተደርጓል • ግብይቱ ተረጋግጧል"
  },
  {
    stepIndex: 4,
    agentText: "በጣም ደስ ብሎኛል! ስለደወሉ ከልብ እናመሰግናለን፤ መልካም ቀን ይሁንልዎ! የኢትዮጵያ ንግድ ባንክ ሁሌም ከእርስዎ ጋር ነው!",
    quickReplies: [
      "እንደገና ደውል (951)",
      "ጥሪውን ጨርስ (Hang Up)"
    ],
    agentStatus: "ጥሪው በተሳካ ሁኔታ ተጠናቋል"
  }
];

export default function App() {
  const [dialNumber, setDialNumber] = useState('');
  const [callState, setCallState] = useState<'idle' | 'calling' | 'ivr' | 'agent' | 'ended'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [dialogueStage, setDialogueStage] = useState<number>(0);
  const [agentStatus, setAgentStatus] = useState<string>('መስመር ላይ ነው');

  const timerRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (callState === 'ivr' || callState === 'agent') {
      timerRef.current = window.setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCallDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, isPlaying]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Sound player for Amharic Speech
   */
  const playAgentVoice = (text: string) => {
    setIsPlaying(true);
    setAgentStatus('ይስሀቅ በድምፅ እያወራ ነው...');

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'am-ET';
        utterance.rate = 0.90;

        utterance.onend = () => {
          setIsPlaying(false);
          setAgentStatus('እርስዎን በማዳመጥ ላይ...');
        };
        utterance.onerror = () => {
          setIsPlaying(false);
          setAgentStatus('እርስዎን በማዳመጥ ላይ...');
        };

        window.speechSynthesis.speak(utterance);
        return;
      } catch {}
    }

    setTimeout(() => {
      setIsPlaying(false);
      setAgentStatus('እርስዎን በማዳመጥ ላይ...');
    }, 2500);
  };

  /**
   * Toggle: First click starts recording, SECOND CLICK stops and sends!
   */
  const handleMicToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      setAgentStatus('ይስሀቅ ድምፅዎን ተረድቶ መልስ እየሰጠ ነው...');

      const defaultAnswers = [
        "ገንዘብ ልኬ ነበር ግን ለሰውየው አልደረሰም",
        "ከራሴ የሲቢኢ ብር (CBE Birr) አካውንት ነው የላኩት",
        "አካውንት ቁጥር 100023456789፤ ስሙ አበበ ከበደ",
        "እሺ በጣም አመሰግናለሁ፤ ሌላ ጥያቄ የለኝም"
      ];
      const answer = userInput.trim() || defaultAnswers[dialogueStage] || "በድምፅ መልስ ተሰጥቷል";
      handleUserResponse(answer);
    } else {
      setIsRecording(true);
      setAgentStatus('🎙️ ይስሀቅ እያዳመጠዎት ነው... አውርተው ሲጨርሱ ማይኩን ድጋሚ ይጫኑ!');

      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        try {
          const rec = new SpeechRec();
          rec.lang = 'am-ET';
          rec.continuous = true;
          rec.interimResults = true;
          rec.onresult = (e: any) => {
            const transcript = Array.from(e.results)
              .map((r: any) => r[0].transcript)
              .join('');
            setUserInput(transcript);
          };
          rec.start();
        } catch {}
      }
    }
  };

  const handleKeypadPress = (key: string) => {
    if (callState === 'idle') {
      setDialNumber((prev) => (prev.length < 10 ? prev + key : prev));
    } else if (callState === 'ivr') {
      if (key === '4') {
        transferToAgent();
      }
    }
  };

  const handleStartCall = (num = dialNumber) => {
    if (!num.trim()) return;
    setCallState('calling');
    setTimeout(() => {
      setCallState('ivr');
    }, 1200);
  };

  const transferToAgent = () => {
    setCallState('agent');
    setDialogueStage(0);

    const first = BANKING_STEPS[0];
    setConversation([
      {
        id: 'step-0',
        sender: 'agent',
        text: first.agentText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    playAgentVoice(first.agentText);
  };

  const handleUserResponse = (text: string) => {
    if (!text.trim() || callState !== 'agent') return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setConversation((prev) => [...prev, userMsg]);
    setUserInput('');

    const nextStage = dialogueStage + 1;
    if (nextStage < BANKING_STEPS.length) {
      setDialogueStage(nextStage);
      setAgentStatus('ይስሀቅ እያሰበበት ነው...');

      setTimeout(() => {
        const nextStep = BANKING_STEPS[nextStage];
        const agentMsg: ChatMessage = {
          id: `agent-${Date.now()}`,
          sender: 'agent',
          text: nextStep.agentText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setConversation((prev) => [...prev, agentMsg]);
        setAgentStatus(nextStep.agentStatus);
        playAgentVoice(nextStep.agentText);
      }, 700);
    } else {
      setTimeout(() => {
        handleEndCall();
      }, 2500);
    }
  };

  const handleEndCall = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCallState('ended');
    setTimeout(() => {
      setCallState('idle');
      setDialNumber('');
      setConversation([]);
      setDialogueStage(0);
      setIsPlaying(false);
      setIsRecording(false);
    }, 1000);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#060A12] p-2 sm:p-4 font-sans text-slate-100">
      
      {/* Main Mobile App Frame */}
      <div className="w-full max-w-[420px] h-[92vh] max-h-[860px] bg-[#0E1726] rounded-[38px] shadow-2xl border-4 border-slate-700/60 flex flex-col overflow-hidden relative">
        
        {/* Top Header */}
        <div className="px-5 pt-3 pb-2 flex justify-between items-center bg-slate-900/90 text-xs text-slate-400 border-b border-slate-800">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Ethio Telecom 4G</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
              CBE AI Voice
            </span>
            <span className="font-semibold text-slate-200">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* SCREEN 1: DIALER */}
        {callState === 'idle' && (
          <div className="flex-1 flex flex-col justify-between p-5 bg-gradient-to-b from-slate-900 to-slate-950">
            <div className="text-center pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/30 text-purple-300 text-xs font-medium mb-3 shadow-inner">
                <Building2 size={13} className="text-purple-400" />
                <span>የኢትዮጵያ ንግድ ባንክ AI ደንበኞች ድጋፍ</span>
              </div>
              <h1 className="text-lg font-bold text-slate-100">951 ይደውሉ</h1>
              <p className="text-xs text-slate-400 mt-0.5">የደንበኞች ድጋፍ መስመር</p>
            </div>

            {/* Display */}
            <div className="flex items-center justify-center h-16 px-4">
              <div className="text-3xl font-bold tracking-widest text-white text-center font-mono">
                {dialNumber || <span className="text-slate-600 font-sans text-xl">951 ይጫኑ...</span>}
              </div>
            </div>

            {/* Quick 951 Call Button */}
            <div className="flex justify-center mb-1">
              <button
                onClick={() => {
                  setDialNumber('951');
                  handleStartCall('951');
                }}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 border border-purple-400/50 flex items-center justify-between text-white text-sm font-semibold transition active:scale-98 shadow-lg shadow-purple-950/60"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm shadow">
                    CBE
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-xs text-white">የኢትዮጵያ ንግድ ባንክ (951)</p>
                    <p className="text-[10px] text-purple-200">ይስሀቅን ለማግኘት ይጫኑ</p>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-emerald-500 text-xs font-bold text-white flex items-center gap-1">
                  ደውል <PhoneCall size={12} />
                </div>
              </button>
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-3 my-auto">
              {[
                { num: '1', sub: ' ' },
                { num: '2', sub: 'ABC' },
                { num: '3', sub: 'DEF' },
                { num: '4', sub: 'GHI' },
                { num: '5', sub: 'JKL' },
                { num: '6', sub: 'MNO' },
                { num: '7', sub: 'PQRS' },
                { num: '8', sub: 'TUV' },
                { num: '9', sub: 'WXYZ' },
                { num: '*', sub: '' },
                { num: '0', sub: '+' },
                { num: '#', sub: '' }
              ].map((btn) => (
                <button
                  key={btn.num}
                  onClick={() => handleKeypadPress(btn.num)}
                  className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-slate-600 transition flex flex-col items-center justify-center border border-slate-700/50 shadow-sm"
                >
                  <span className="text-xl font-bold text-slate-100 leading-none">{btn.num}</span>
                  {btn.sub && <span className="text-[9px] text-slate-400 tracking-wider mt-0.5">{btn.sub}</span>}
                </button>
              ))}
            </div>

            {/* Bottom Call Bar */}
            <div className="flex items-center justify-around pt-2 pb-3">
              <div className="w-14"></div>
              <button
                onClick={() => handleStartCall()}
                disabled={!dialNumber}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition active:scale-95 ${
                  dialNumber
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-900/50'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <PhoneCall size={28} />
              </button>
              <div className="w-14 flex justify-center">
                {dialNumber && (
                  <button
                    onClick={() => setDialNumber((prev) => prev.slice(0, -1))}
                    className="p-3 text-slate-400 hover:text-slate-200 transition active:scale-90"
                  >
                    <Delete size={22} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 2: CALLING */}
        {callState === 'calling' && (
          <div className="flex-1 flex flex-col justify-between items-center p-8 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900">
            <div className="text-center pt-8">
              <div className="w-24 h-24 mx-auto mb-4 rounded-3xl bg-purple-900/50 border-2 border-purple-500/40 flex items-center justify-center shadow-xl animate-pulse">
                <Building2 size={46} className="text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">የኢትዮጵያ ንግድ ባንክ</h2>
              <p className="text-sm text-purple-300 font-mono mt-1 tracking-wider">951</p>
              <p className="text-xs text-emerald-400 font-medium mt-3 flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                ጥሪው እየተገናኘ ነው...
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <button
                onClick={handleEndCall}
                className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg shadow-rose-950/60 active:scale-95 transition"
              >
                <PhoneOff size={28} />
              </button>
              <span className="text-xs text-slate-400">ጥሪውን አቋርጥ</span>
            </div>
          </div>
        )}

        {/* SCREEN 3: IVR AUTOMATED MENU */}
        {callState === 'ivr' && (
          <div className="flex-1 flex flex-col justify-between p-5 bg-gradient-to-b from-slate-900 to-slate-950">
            <div className="text-center pt-2 pb-3 border-b border-slate-800">
              <div className="flex items-center justify-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider">
                <Building2 size={14} />
                <span>CBE 951 Automated System</span>
              </div>
              <p className="text-sm font-mono text-emerald-400 mt-1 font-bold">{formatTime(callDuration)}</p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-950/50 border-2 border-purple-500/40 text-center my-3 shadow-lg">
              <div className="w-12 h-12 rounded-full bg-purple-600/30 text-amber-300 flex items-center justify-center mx-auto mb-2.5">
                <Volume2 size={24} className="animate-bounce" />
              </div>
              <p className="text-sm text-purple-100 leading-relaxed font-semibold">
                እንኳን ወደ ኢትዮጵያ ንግድ ባንክ በደህና መጡ!
              </p>
              <p className="text-xs text-amber-300 mt-1 font-medium">
                የደንበኞች ድጋፍ ሰጪ ይስሀቅን ለማግኘት ከታች ያለውን <span className="font-bold underline">4 ቁጥርን</span> ይጫኑ!
              </p>
            </div>

            {/* Direct 4 Button */}
            <div className="my-auto px-2">
              <button
                onClick={transferToAgent}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-purple-900/50 flex items-center justify-center gap-3 active:scale-95 transition border-2 border-amber-400 ring-4 ring-amber-400/20"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-400 text-purple-950 flex items-center justify-center text-3xl font-black shadow-md">
                  4
                </div>
                <div className="text-left">
                  <p className="text-xs font-black text-amber-200 uppercase tracking-wider">ይጫኑት (Click 4)</p>
                  <p className="text-sm font-bold text-white">ከይስሀቅ ጋር በቀጥታ ለመነጋገር</p>
                </div>
              </button>
            </div>

            <div className="flex justify-center pt-3">
              <button
                onClick={handleEndCall}
                className="px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-2 shadow-lg transition active:scale-95"
              >
                <PhoneOff size={16} />
                <span>ጥሪውን አቋርጥ</span>
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 4: CBE AI SMART SUPPORT */}
        {callState === 'agent' && (
          <div className="flex-1 flex flex-col justify-between bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 overflow-hidden">
            
            {/* Top Agent Bar */}
            <div className="p-3.5 bg-slate-900/95 border-b border-slate-800 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative">
                    <div
                      className={`w-13 h-13 rounded-2xl bg-gradient-to-tr from-purple-800 via-indigo-700 to-amber-500 p-0.5 shadow-lg transition-transform ${
                        isPlaying ? 'scale-105 ring-4 ring-amber-400/70 shadow-amber-500/40' : isRecording ? 'scale-105 ring-4 ring-rose-500/70 shadow-rose-500/40 animate-pulse' : ''
                      }`}
                    >
                      <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center relative overflow-hidden">
                        <Headphones
                          size={26}
                          className={`text-amber-300 transition-transform ${
                            isPlaying ? 'rotate-3 scale-110 text-amber-200' : isRecording ? 'text-rose-400 animate-pulse' : ''
                          }`}
                        />
                      </div>
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm text-white">ይስሀቅ (CBE Support)</h3>
                      <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                        AI Voice
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <span>መስመር 951</span> • <span className="text-emerald-400 font-mono font-bold">{formatTime(callDuration)}</span>
                    </p>
                    <p className="text-[10px] font-medium mt-0.5">
                      {isPlaying ? (
                        <span className="text-amber-300 flex items-center gap-1 font-bold animate-pulse">
                          <Activity size={10} className="animate-spin text-amber-400" />
                          ይስሀቅ በድምፅ እያወራ ነው...
                        </span>
                      ) : isRecording ? (
                        <span className="text-rose-400 flex items-center gap-1 font-bold animate-pulse">
                          <Activity size={10} />
                          🎙️ ድምፅዎን እያዳመጠ ነው...
                        </span>
                      ) : (
                        <span className="text-slate-300">👂 {agentStatus}</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      const cur = BANKING_STEPS[dialogueStage];
                      if (cur) playAgentVoice(cur.agentText);
                    }}
                    className="px-2.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1"
                    title="ድምፁን አጫውት"
                  >
                    <Play size={14} className="fill-current" />
                    <span>አጫውት</span>
                  </button>
                  <button
                    onClick={handleEndCall}
                    className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md active:scale-95 transition"
                    title="ጥሪ አቋርጥ"
                  >
                    <PhoneOff size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {conversation.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5 px-1">
                    <span>{msg.sender === 'user' ? 'እርስዎ (ደንበኛ)' : 'ይስሀቅ (CBE Support)'}</span>
                    <span>• {msg.time}</span>
                  </div>
                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-md ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-xs'
                        : 'bg-slate-800 border border-purple-500/30 text-slate-100 rounded-bl-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <span>{msg.text}</span>
                      {msg.sender === 'agent' && (
                        <button
                          onClick={() => playAgentVoice(msg.text)}
                          className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-2 py-1 rounded-lg transition shrink-0 font-bold flex items-center gap-1 shadow-sm active:scale-95"
                          title="ድምፁን አጫውት"
                        >
                          <Play size={10} className="fill-current" />
                          <span className="text-[10px]">ድምፅ</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* User Interaction Area */}
            <div className="px-3 pt-2 bg-slate-900/95 border-t border-slate-800/90">
              <p className="text-[10px] font-semibold text-purple-300 mb-1.5 flex items-center gap-1">
                <Sparkles size={11} className="text-amber-400" />
                ፈጣን መልሶች (ወይም ማይኩን ነክተው ይናገሩ)፦
              </p>

              {/* Quick stage suggestions */}
              <div className="flex flex-wrap gap-1.5 mb-2 max-h-24 overflow-y-auto pb-1">
                {BANKING_STEPS[dialogueStage]?.quickReplies.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (opt.includes("እንደገና ደውል")) {
                        handleStartCall('951');
                      } else if (opt.includes("ጥሪውን ጨርስ")) {
                        handleEndCall();
                      } else {
                        handleUserResponse(opt);
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900 border border-purple-500/30 text-purple-200 text-xs font-medium transition active:scale-95 text-left"
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {/* Mic & Text Input */}
              <div className="flex items-center gap-2 pb-3">
                <button
                  onClick={handleMicToggle}
                  className={`p-2.5 rounded-xl border transition flex items-center gap-1.5 ${
                    isRecording
                      ? 'bg-rose-600 border-rose-400 text-white animate-pulse shadow-lg shadow-rose-900/50'
                      : 'bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-700'
                  }`}
                  title={isRecording ? 'አውርተው ሲጨርሱ እዚህ ይጫኑ' : 'ድምፅ ለመናገር ይጫኑ'}
                >
                  <Mic size={18} />
                  {isRecording ? (
                    <span className="text-[10px] font-bold text-white">ሲጨርሱ ይጫኑት 🛑</span>
                  ) : (
                    <span className="text-[10px] font-bold">ተናገር 🎙️</span>
                  )}
                </button>

                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUserResponse(userInput);
                  }}
                  placeholder="መልስዎን እዚህ ይጻፉ ወይም ማይኩን ይጫኑ..."
                  className="flex-1 bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />

                <button
                  onClick={() => handleUserResponse(userInput)}
                  disabled={!userInput.trim()}
                  className={`p-2.5 rounded-xl transition ${
                    userInput.trim()
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md'
                      : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 5: ENDED */}
        {callState === 'ended' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-950 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
              <PhoneOff size={28} />
            </div>
            <h3 className="text-lg font-bold text-white">ጥሪው ተቋርጧል</h3>
            <p className="text-xs text-slate-400 mt-1">ስለደወሉ እናመሰግናለን!</p>
          </div>
        )}
      </div>
    </div>
  );
}
