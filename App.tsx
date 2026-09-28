import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Delete,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Building2,
  ShieldCheck,
  Send,
  Sparkles,
  RotateCcw,
  Headphones,
  Award,
  ChevronRight,
  Activity,
  CheckCircle2,
  Radio
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'agent' | 'user';
  text: string;
  time: string;
  audioFile?: string;
}

// Exactly structured banking dialog flow with authentic AmehaNeural voice clips
const CBE_FLOW = [
  {
    stage: 0,
    audio: '/audio/step1.mp3',
    agentText: "ሰላም ጤና ይስጥልኝ ከኢትዮጵያ ንግድ ባንክ ነው፤ እባክዎት ምን ልርዳዎት?",
    quickReplies: [
      "ገንዘብ ልኬ ነበር ግን ለሰውየው አልደረሰም",
      "ብር አስተላልፌ ነበር ግን መልዕክት አልደረሰውም",
      "ስለተላከ ብር ላጣራ ነበር"
    ],
    agentStatus: "ይስሀቅ መስመር ላይ ነው • እርስዎን በማዳመጥ ላይ"
  },
  {
    stage: 1,
    audio: '/audio/step2.mp3',
    agentText: "እሺ ደንበኛችን፤ ለመሆኑ ገንዘቡን ከየትኛው አካውንት ነው የላኩት? ወይስ ከእርስዎ የሲቢኢ ብር አካውንት ነው?",
    quickReplies: [
      "ከራሴ የሲቢኢ ብር (CBE Birr) አካውንት ነው የላኩት",
      "ከመደበኛ የባንክ ሂሳብ ቁጥሬ ነው",
      "በሞባይል ባንኪንግ ነው የላኩት"
    ],
    agentStatus: "ይስሀቅ የአካውንት አይነት እየጠየቀ ነው"
  },
  {
    stage: 2,
    audio: '/audio/step3.mp3',
    agentText: "እሺ አዳምጬ ተረድቻለሁ፤ እባክዎ የተላከለት ሰው የአካውንት ስም እና የአካውንት ቁጥር ይንገሩኝ?",
    quickReplies: [
      "አካውንት ቁጥር 100023456789፤ ስሙ አበበ ከበደ",
      "አካውንት 100098765432፤ ስሟ ትዕግስት ኃይሉ",
      "ስልኩ 0911223344፤ ስሙ ተስፋዬ በቀለ"
    ],
    agentStatus: "ይስሀቅ የተቀባይ መረጃ በመጠየቅ ላይ..."
  },
  {
    stage: 3,
    audio: '/audio/step4.mp3',
    agentText: "እሺ በሲስተማችን ቼክ እያደረግሁ ነው... አዎ! ግብይቱን እያየሁት ነው፤ በሲስተም መዘግየት ምክንያት ነው መልዕክቱ ያልደረሰው። በ24 ሰዓት ውስጥ ለተላከለት ሰው ሙሉ በሙሉ ይደርሳል!",
    quickReplies: [
      "እሺ በጣም አመሰግናለሁ፤ ሌላ ጥያቄ የለኝም",
      "እሺ ይደርሳል ካሉኝ እጠብቃለሁ መልካም ቀን",
      "በጣም አመሰግናለሁ ሰላም ሁኑ"
    ],
    agentStatus: "በሲስተም ቼክ ተደርጓል • ግብይቱ ተረጋግጧል"
  },
  {
    stage: 4,
    audio: '/audio/step5.mp3',
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [volumeOn, setVolumeOn] = useState(true);
  const [dialogueStage, setDialogueStage] = useState<number>(0);
  const [agentStatus, setAgentStatus] = useState<string>('መስመር ላይ ነው');

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Call duration counter
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
  }, [conversation, isSpeaking]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Telecom audio tones (DTMF keypad & ring)
  const playTone = (freq1: number, freq2: number, duration: number = 0.15) => {
    if (!volumeOn) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.value = freq1;
      osc2.frequency.value = freq2;

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + duration);
      osc2.stop(ctx.currentTime + duration);
    } catch {
      // Audio fallback
    }
  };

  /**
   * Plays the genuine AmehaNeural Amharic AI MP3 directly from the app
   * with seamless Web Speech fallback for unmatched reliability.
   */
  const playAgentAmharicVoice = (audioSrc: string, fallbackText: string) => {
    if (!volumeOn) return;

    // Stop any existing playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    setIsSpeaking(true);
    setAgentStatus('ይስሀቅ በድምፅ እየተናገረ ነው...');

    try {
      const audio = new Audio(audioSrc);
      currentAudioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        setAgentStatus('እርስዎን በማዳመጥ ላይ...');
      };

      audio.onerror = () => {
        // Fallback to browser Web Speech API if audio element encounters restriction
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(fallbackText);
          utterance.rate = 0.92;
          const voices = window.speechSynthesis.getVoices();
          const am = voices.find((v) => v.lang.includes('am') || v.name.includes('Amharic'));
          if (am) utterance.voice = am;
          utterance.onend = () => {
            setIsSpeaking(false);
            setAgentStatus('እርስዎን በማዳመጥ ላይ...');
          };
          window.speechSynthesis.speak(utterance);
        } else {
          setIsSpeaking(false);
          setAgentStatus('እርስዎን በማዳመጥ ላይ...');
        }
      };

      audio.play().catch(() => {
        // If autoplay policy requires user gesture, use speech synthesis fallback
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(fallbackText);
          utterance.onend = () => {
            setIsSpeaking(false);
            setAgentStatus('እርስዎን በማዳመጥ ላይ...');
          };
          window.speechSynthesis.speak(utterance);
        } else {
          setIsSpeaking(false);
        }
      });
    } catch {
      setIsSpeaking(false);
    }
  };

  // Live Speech Recognition (Microphone listener)
  const toggleListening = () => {
    // Check speech recognition support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("ብራውዘርዎ ማይክራፎን ድምፅ መቀበያውን ለመክፈት ፍቃድ ይፈልጋል፤ ወይም ከታች ካሉት ፈጣን መልሶች አንዱን ይጫኑ!");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'am-ET'; // Amharic Ethiopian
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setAgentStatus('ይስሀቅ እስኪጨርሱ በትዕግስት እያዳመጠ ነው...');
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setUserInput(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
        setAgentStatus('እርስዎን በማዳመጥ ላይ...');
      };

      recognition.onend = () => {
        setIsListening(false);
        if (userInput.trim()) {
          handleUserResponse(userInput);
        } else {
          setAgentStatus('እርስዎን በማዳመጥ ላይ...');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Keypad press
  const handleKeypadPress = (key: string) => {
    playTone(697, 1209, 0.1);
    if (callState === 'idle') {
      setDialNumber((prev) => (prev.length < 12 ? prev + key : prev));
    } else if (callState === 'ivr') {
      if (key === '4') {
        transferToAgent();
      }
    }
  };

  // Start Call
  const handleStartCall = (num = dialNumber) => {
    if (!num.trim()) return;
    playTone(440, 480, 0.4);
    setCallState('calling');

    setTimeout(() => {
      setCallState('ivr');
      playTone(941, 1336, 0.3);
    }, 1800);
  };

  // Transfer to Agent (Key 4)
  const transferToAgent = () => {
    playTone(770, 1209, 0.25);
    setCallState('calling');

    setTimeout(() => {
      setCallState('agent');
      setDialogueStage(0);
      const firstStep = CBE_FLOW[0];
      setConversation([
        {
          id: 'step-0',
          sender: 'agent',
          text: firstStep.agentText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          audioFile: firstStep.audio
        }
      ]);
      playAgentAmharicVoice(firstStep.audio, firstStep.agentText);
    }, 1200);
  };

  // Handle user response (from speech or button or input)
  const handleUserResponse = (text: string) => {
    if (!text.trim() || callState !== 'agent') return;

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setConversation((prev) => [...prev, userMsg]);
    setUserInput('');

    // Agent reasoning delay (feels natural like a real human call agent thinking)
    const nextStage = dialogueStage + 1;
    if (nextStage < CBE_FLOW.length) {
      setDialogueStage(nextStage);
      setAgentStatus(nextStage === 3 ? 'በሲስተም ቼክ እያደረገ ነው...' : 'ይስሀቅ አዳምጦ እያሰበበት ነው...');

      setTimeout(() => {
        const nextStep = CBE_FLOW[nextStage];
        const agentMsg: ChatMessage = {
          id: `agent-${Date.now()}`,
          sender: 'agent',
          text: nextStep.agentText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          audioFile: nextStep.audio
        };
        setConversation((prev) => [...prev, agentMsg]);
        setAgentStatus(nextStep.agentStatus);
        playAgentAmharicVoice(nextStep.audio, nextStep.agentText);
      }, 1000);
    } else {
      setTimeout(() => {
        handleEndCall();
      }, 2500);
    }
  };

  // End Call
  const handleEndCall = () => {
    playTone(425, 425, 0.3);
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCallState('ended');
    setTimeout(() => {
      setCallState('idle');
      setDialNumber('');
      setConversation([]);
      setDialogueStage(0);
      setIsSpeaking(false);
      setIsListening(false);
    }, 1400);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#070D18] p-2 sm:p-4 font-sans text-slate-100">
      {/* Mobile Device Frame */}
      <div className="w-full max-w-[420px] h-[92vh] max-h-[860px] bg-[#111C30] rounded-[38px] shadow-2xl border-4 border-slate-700/60 flex flex-col overflow-hidden relative">
        
        {/* Top Status Bar */}
        <div className="px-6 pt-3 pb-2 flex justify-between items-center bg-slate-900/80 backdrop-blur-md text-xs text-slate-400 border-b border-slate-800">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Ethio Telecom 4G</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-semibold border border-purple-500/30">
              Ameha AI Voice
            </span>
            <button
              onClick={() => setVolumeOn(!volumeOn)}
              className="text-slate-300 hover:text-white transition"
              title="ድምፅ ማብሪያ/ማጥፊያ"
            >
              {volumeOn ? <Volume2 size={16} className="text-emerald-400" /> : <VolumeX size={16} className="text-rose-400" />}
            </button>
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
              <p className="text-xs text-slate-400 mt-0.5">በእውነተኛው የአመሃ (Ameha) AI ድምፅ የተዘጋጀ</p>
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
                className="w-full py-2.5 px-4 rounded-xl bg-purple-900/40 hover:bg-purple-900/60 border border-purple-500/40 flex items-center justify-between text-purple-200 text-sm font-medium transition active:scale-98"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center font-bold text-xs text-white shadow-md">
                    CBE
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-xs text-purple-100">የኢትዮጵያ ንግድ ባንክ (951)</p>
                    <p className="text-[10px] text-purple-300/80">ጥሪ ማዕከል • 4 ሲነካ ድጋፍ ሰጪ ይስሀቅ</p>
                  </div>
                </div>
                <div className="px-2 py-1 rounded-md bg-purple-500/30 text-xs font-bold text-white flex items-center gap-1">
                  ደውል <ChevronRight size={12} />
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

            <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-center my-2 shadow-inner">
              <div className="w-10 h-10 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center mx-auto mb-2">
                <Volume2 size={20} className="animate-bounce" />
              </div>
              <p className="text-xs text-purple-200 leading-relaxed font-medium">
                "እንኳን ወደ ኢትዮጵያ ንግድ ባንክ በደህና መጡ! የደንበኞች ድጋፍ ሰጪ ይስሀቅን ለማግኘት <span className="font-bold text-amber-300 underline text-sm">4 ቁጥርን</span> ይጫኑ!"
              </p>
            </div>

            <div className="my-auto px-4">
              <button
                onClick={transferToAgent}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-base shadow-lg shadow-purple-900/40 flex items-center justify-center gap-3 active:scale-98 transition border border-purple-400/40"
              >
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-xl font-black">
                  4
                </div>
                <span>ወደ ደንበኞች ድጋፍ ለማስተላለፍ 4ን ይጫኑ</span>
              </button>
            </div>

            <div className="flex justify-center pt-3">
              <button
                onClick={handleEndCall}
                className="px-6 py-2.5 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-semibold flex items-center gap-2 shadow-lg transition active:scale-95"
              >
                <PhoneOff size={16} />
                <span>ጥሪውን አቋርጥ</span>
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 4: CBE AI SMART SUPPORT (Real AmehaNeural Voice + Real Listening) */}
        {callState === 'agent' && (
          <div className="flex-1 flex flex-col justify-between bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 overflow-hidden">
            
            {/* Top Agent Bar */}
            <div className="p-4 bg-slate-900/95 border-b border-slate-800 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Dynamic Glowing Live Avatar */}
                  <div className="relative">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-800 via-indigo-700 to-amber-500 p-0.5 shadow-lg transition-transform ${
                        isSpeaking ? 'scale-105 ring-4 ring-amber-400/60 shadow-amber-500/30' : isListening ? 'scale-105 ring-4 ring-emerald-400/60 shadow-emerald-500/30' : ''
                      }`}
                    >
                      <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center relative overflow-hidden">
                        <Headphones
                          size={28}
                          className={`text-amber-300 transition-transform ${
                            isSpeaking ? 'rotate-3 scale-110 text-amber-200' : isListening ? 'text-emerald-400 animate-pulse' : ''
                          }`}
                        />
                      </div>
                    </div>
                    {/* Online indicator */}
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm text-white">ይስሀቅ (CBE Support)</h3>
                      <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[10px] font-semibold border border-purple-500/30">
                        Ameha AI
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <span>ጥሪ ማዕከል</span> • <span className="text-emerald-400 font-mono font-semibold">{formatTime(callDuration)}</span>
                    </p>
                    <p className="text-[10px] text-amber-300 font-medium">
                      {isSpeaking ? (
                        <span className="text-amber-300 flex items-center gap-1">
                          <Activity size={10} className="animate-spin text-amber-400" />
                          ይስሀቅ በድምፅ እየተናገረ ነው...
                        </span>
                      ) : isListening ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <Activity size={10} className="animate-pulse" />
                          እርስዎን እያዳመጠ ነው (እስኪጨርሱ ይጠብቃል)...
                        </span>
                      ) : (
                        `👂 ${agentStatus}`
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const curStep = CBE_FLOW[dialogueStage];
                      if (curStep) playAgentAmharicVoice(curStep.audio, curStep.agentText);
                    }}
                    className="p-2 rounded-xl bg-purple-900/40 hover:bg-purple-900/70 text-purple-200 border border-purple-500/30 transition"
                    title="ድምጹን በድጋሚ አጫውት"
                  >
                    <RotateCcw size={16} />
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

              {/* Status Step Bar */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <ShieldCheck size={12} />
                  ደረጃ {dialogueStage + 1} / {CBE_FLOW.length}
                </span>
                <span className="text-slate-300 font-medium truncate max-w-[220px]">
                  {agentStatus}
                </span>
              </div>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {conversation.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1 px-1">
                    <span>{msg.sender === 'user' ? 'እርስዎ (ደንበኛ)' : 'ይስሀቅ (CBE Support)'}</span>
                    <span>• {msg.time}</span>
                  </div>
                  <div
                    className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-md ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-xs'
                        : 'bg-slate-800/95 border border-purple-500/20 text-slate-100 rounded-bl-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span>{msg.text}</span>
                      {msg.sender === 'agent' && msg.audioFile && (
                        <button
                          onClick={() => playAgentAmharicVoice(msg.audioFile!, msg.text)}
                          className="text-purple-300 hover:text-white p-0.5 rounded transition mt-0.5 shrink-0"
                          title="ይህንን ድምፅ አጫውት"
                        >
                          <Volume2 size={13} />
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
                {CBE_FLOW[dialogueStage]?.quickReplies.map((opt, i) => (
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
                  onClick={toggleListening}
                  className={`p-2.5 rounded-xl border transition flex items-center gap-1.5 ${
                    isListening
                      ? 'bg-emerald-600 border-emerald-400 text-white animate-pulse shadow-lg shadow-emerald-900/50'
                      : 'bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-700'
                  }`}
                  title={isListening ? 'እየሰማ ነው...' : 'ለማውራት ማይኩን ይጫኑ'}
                >
                  <Mic size={18} />
                  {isListening && <span className="text-[10px] font-bold">እየሰማ ነው...</span>}
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
