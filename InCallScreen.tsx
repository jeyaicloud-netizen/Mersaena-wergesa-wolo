import { useState, useEffect, useRef } from 'react';
import { ActiveCallState } from '../types';
import { PhoneOff, Mic, MicOff, Volume2, Grid3X3, MoreVertical, X, Disc } from 'lucide-react';
import { playDtmfTone, triggerHaptic } from '../utils/audio';

interface InCallScreenProps {
  call: ActiveCallState;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onToggleRecord: () => void;
  onToggleInCallKeypad: () => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

const IN_CALL_KEYPAD_DIGITS = [
  '1', '2', '3',
  '4', '5', '6',
  '7', '8', '9',
  '*', '0', '#'
];

export default function InCallScreen({
  call,
  onEndCall,
  onToggleMute,
  onToggleSpeaker,
  onToggleRecord,
  onToggleInCallKeypad,
  soundEnabled,
  vibrationEnabled,
}: InCallScreenProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [enteredDtmf, setEnteredDtmf] = useState('');

  // Audio elements for 951 IVR flow
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Check if current call is to 951 (Ethio telecom Customer Service / IVR)
  const is951Call = call.number.trim() === '951';

  // Handle IVR playback when 951 is connected
  useEffect(() => {
    if (!is951Call) return;

    if (call.status === 'connected') {
      const audio = new Audio('/voice1.mp3');
      audio.preload = 'auto';
      audio.muted = call.isMuted;
      audio.volume = call.isSpeaker ? 1.0 : 0.65;
      currentAudioRef.current = audio;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Auto-play was prevented or user hasn't interacted yet
        });
      }

      return () => {
        audio.pause();
        audio.currentTime = 0;
        currentAudioRef.current = null;
      };
    }
  }, [is951Call, call.status]);

  // Sync mute and speaker state to audio
  useEffect(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.muted = call.isMuted || isOnHold;
      currentAudioRef.current.volume = call.isSpeaker ? 1.0 : 0.65;
    }
  }, [call.isMuted, call.isSpeaker, isOnHold]);

  // Format timer MM:SS
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const minStr = mins < 10 ? `0${mins}` : `${mins}`;
    const secStr = secs < 10 ? `0${secs}` : `${secs}`;
    return `${minStr}:${secStr}`;
  };

  const handleDtmfPress = (digit: string) => {
    if (soundEnabled) playDtmfTone(digit, 150);
    if (vibrationEnabled) triggerHaptic(15);
    setEnteredDtmf((prev) => prev + digit);

    // If calling 951 and user presses '4', interrupt voice1 and play voice2.mp3
    if (is951Call && digit === '4') {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      }

      const audio2 = new Audio('/voice2.mp3');
      audio2.preload = 'auto';
      audio2.muted = call.isMuted || isOnHold;
      audio2.volume = call.isSpeaker ? 1.0 : 0.65;
      currentAudioRef.current = audio2;

      const playPromise = audio2.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.log('voice2.mp3 play error or file pending upload:', err);
        });
      }

      // Automatically end call a short moment after voice2 finishes playing
      audio2.addEventListener('ended', () => {
        setTimeout(() => {
          handleHangup();
        }, 1200);
      });
    }
  };

  // When user hangs up, make sure audio stops
  const handleHangup = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    onEndCall();
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#F2F1F8] flex flex-col justify-between select-none safe-top safe-bottom">
      {/* Toast Notification for Recording Saved (Screenshot 8) */}
      {call.recordingSavedToast && (
        <div className="absolute bottom-28 left-4 right-4 z-50 flex justify-center animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-[#2B2930] text-white text-[14px] px-5 py-3 rounded-xl shadow-lg flex items-center justify-between w-full max-w-sm">
            <span>Recording saved.</span>
          </div>
        </div>
      )}

      {/* Top Section: Timer & Recording status */}
      <div className="pt-8 text-center space-y-2">
        {/* Recording indicator & timer - Screenshot 4 & 5 */}
        <div className="flex items-center justify-center gap-2 text-sm font-medium text-[#49454F]">
          {call.isRecording ? (
            <div className="flex items-center gap-1.5 text-[#B3261E]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B3261E] animate-pulse-recording inline-block" />
              <span className="font-mono text-[15px]">{formatTime(call.seconds)}</span>
            </div>
          ) : (
            <span className="font-mono text-[15px] text-[#49454F]">
              {call.status === 'calling' ? 'Calling…' : formatTime(call.seconds)}
            </span>
          )}
        </div>

        {/* Dialed Contact Name or Number - Large Display */}
        <div className="pt-2">
          <h1 className="text-[40px] font-normal text-[#1D1B20] tracking-tight">
            {call.name || call.number}
          </h1>
          {call.name && (
            <p className="text-sm text-[#49454F] mt-0.5">{call.number}</p>
          )}

          {/* Carrier in teal color - Screenshot 4 */}
          <p className="text-[15px] text-[#00897B] font-medium mt-1">
            {isOnHold ? 'Call on hold' : call.carrier || 'Ethio telecom'}
          </p>
        </div>
      </div>

      {/* Center in-call DTMF Keypad Overlay (Screenshot 6 & 8) */}
      {call.inCallKeypadOpen && (
        <div className="flex-1 flex flex-col justify-end px-4 pb-2 animate-in slide-in-from-bottom duration-200">
          <div className="bg-[#EFEBFA] rounded-3xl p-4 shadow-lg border border-[#E3DFEC]">
            {/* Top close button & entered DTMF digits */}
            <div className="flex items-center justify-between mb-3 px-2">
              <button
                type="button"
                onClick={onToggleInCallKeypad}
                className="p-1.5 text-[#49454F] hover:text-[#1D1B20] rounded-full active:scale-90"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="text-xl font-mono text-[#1D1B20] tracking-widest truncate max-w-[200px]">
                {enteredDtmf || '\u00A0'}
              </div>
              <div className="w-8" />
            </div>

            {/* In-Call Keypad Grid */}
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
              {IN_CALL_KEYPAD_DIGITS.map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDtmfPress(digit)}
                  className="dial-btn bg-white rounded-full h-12 flex items-center justify-center text-xl font-normal text-[#1D1B20] shadow-xs border border-[#E7E4ED] active:scale-95"
                >
                  {digit}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom In-Call Controls Card & End Call Button */}
      <div className="w-full pb-8 pt-4 px-6 space-y-6">
        {/* 4 Action Buttons: Keypad, Mute, Speaker, More */}
        <div className="flex items-center justify-around max-w-sm mx-auto">
          {/* 1. Keypad */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={onToggleInCallKeypad}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                call.inCallKeypadOpen
                  ? 'bg-[#1D1B20] text-white rounded-2xl'
                  : 'bg-white hover:bg-[#FAF9FD] text-[#1D1B20]'
              }`}
              aria-label="Keypad"
            >
              <Grid3X3 className="w-6 h-6" />
            </button>
            <span className="text-xs text-[#49454F] font-medium">Keypad</span>
          </div>

          {/* 2. Mute */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={onToggleMute}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                call.isMuted
                  ? 'bg-[#1D1B20] text-white rounded-2xl'
                  : 'bg-white hover:bg-[#FAF9FD] text-[#1D1B20]'
              }`}
              aria-label="Mute"
            >
              {call.isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            <span className="text-xs text-[#49454F] font-medium">
              {call.isMuted ? 'Muted' : 'Mute'}
            </span>
          </div>

          {/* 3. Speaker - Screenshot 5 shows Speaker in dark navy rounded square when active! */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={onToggleSpeaker}
              className={`w-16 h-16 flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                call.isSpeaker
                  ? 'bg-[#1D1B20] text-white rounded-2xl'
                  : 'bg-white hover:bg-[#FAF9FD] text-[#1D1B20] rounded-full'
              }`}
              aria-label="Speaker"
            >
              <Volume2 className="w-6 h-6" />
            </button>
            <span className="text-xs text-[#49454F] font-medium">Speaker</span>
          </div>

          {/* 4. More */}
          <div className="flex flex-col items-center gap-2 relative">
            <button
              type="button"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="w-16 h-16 rounded-full bg-white hover:bg-[#FAF9FD] text-[#1D1B20] flex items-center justify-center shadow-xs transition-all cursor-pointer"
              aria-label="More options"
            >
              <MoreVertical className="w-6 h-6" />
            </button>
            <span className="text-xs text-[#49454F] font-medium">More</span>

            {/* Popup Menu */}
            {showMoreMenu && (
              <div className="absolute bottom-full right-0 mb-3 w-48 bg-white rounded-2xl shadow-xl border border-[#E0DFE8] py-1.5 z-50 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    onToggleRecord();
                    setShowMoreMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left flex items-center gap-2.5 hover:bg-[#F2F1F8] text-[#1D1B20]"
                >
                  <Disc className={`w-4 h-4 ${call.isRecording ? 'text-[#B3261E]' : 'text-[#49454F]'}`} />
                  <span>{call.isRecording ? 'Stop recording' : 'Record call'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOnHold(!isOnHold);
                    setShowMoreMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-[#F2F1F8] text-[#1D1B20]"
                >
                  {isOnHold ? 'Resume call' : 'Hold call'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    alert('Add conference call option');
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-[#F2F1F8] text-[#1D1B20]"
                >
                  Add call
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Big Red Pill End Call Button - Screenshot 4 & 5 */}
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={handleHangup}
            className="w-[140px] h-[54px] rounded-full bg-[#D32F2F] hover:bg-[#C62828] active:scale-95 text-white flex items-center justify-center shadow-[0_4px_12px_rgba(211,47,47,0.4)] transition-all cursor-pointer"
            aria-label="End call"
          >
            <PhoneOff className="w-6 h-6 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
}
