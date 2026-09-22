import { useState, useRef } from 'react';
import { Contact } from '../types';
import { Phone, Delete, MoreVertical, UserPlus, MessageSquare, Plus } from 'lucide-react';
import { playDtmfTone, triggerHaptic } from '../utils/audio';

interface DialpadSheetProps {
  digits: string;
  onDigitsChange: (val: string) => void;
  contacts: Contact[];
  onInitiateCall: (number: string, name?: string) => void;
  onCreateNewContact: (number: string) => void;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface KeypadItem {
  digit: string;
  sub: string;
  isSpecial?: boolean;
}

const KEYPAD_BUTTONS: KeypadItem[] = [
  { digit: '1', sub: '➿' },
  { digit: '2', sub: 'ABC' },
  { digit: '3', sub: 'DEF' },
  { digit: '4', sub: 'GHI' },
  { digit: '5', sub: 'JKL' },
  { digit: '6', sub: 'MNO' },
  { digit: '7', sub: 'PQRS' },
  { digit: '8', sub: 'TUV' },
  { digit: '9', sub: 'WXYZ' },
  { digit: '*', sub: '', isSpecial: true },
  { digit: '0', sub: '+', isSpecial: true },
  { digit: '#', sub: '', isSpecial: true },
];

export default function DialpadSheet({
  digits,
  onDigitsChange,
  contacts,
  onInitiateCall,
  onCreateNewContact,
  soundEnabled,
  vibrationEnabled,
}: DialpadSheetProps) {
  const [showOptions, setShowOptions] = useState(false);
  const backspaceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleKeyPress = (digit: string) => {
    if (soundEnabled) playDtmfTone(digit);
    if (vibrationEnabled) triggerHaptic(12);
    onDigitsChange(digits + digit);
  };

  const handleZeroLongPress = () => {
    if (soundEnabled) playDtmfTone('0');
    if (vibrationEnabled) triggerHaptic(20);
    onDigitsChange(digits + '+');
  };

  const handleBackspace = () => {
    if (vibrationEnabled) triggerHaptic(15);
    if (digits.length > 0) {
      onDigitsChange(digits.slice(0, -1));
    }
  };

  const handleBackspaceMouseDown = () => {
    backspaceTimerRef.current = setTimeout(() => {
      if (vibrationEnabled) triggerHaptic(35);
      onDigitsChange('');
    }, 600);
  };

  const handleBackspaceMouseUp = () => {
    if (backspaceTimerRef.current) {
      clearTimeout(backspaceTimerRef.current);
      backspaceTimerRef.current = null;
    }
  };

  // Find matching contact if dialed
  const matchedContact = digits
    ? contacts.find((c) => c.number.replace(/\s+/g, '').includes(digits.replace(/\s+/g, '')) || c.name.includes(digits))
    : null;

  return (
    <div className="w-full flex flex-col flex-1 pb-20 justify-end">
      {/* Top area when dialpad is open */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {digits.length === 0 ? (
          /* Suggested Contacts Section - Screenshot 1 */
          <div className="space-y-3">
            <div className="text-xs font-semibold text-[#49454F] px-1">Suggested</div>
            <div className="space-y-2">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => onInitiateCall(contact.number, contact.name)}
                  className="bg-white rounded-2xl p-3.5 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.04)] border border-[#ECEAF2] cursor-pointer active:bg-[#F6F5FA]"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center font-medium text-white text-base shadow-xs"
                      style={{ backgroundColor: contact.avatarColor }}
                    >
                      {contact.avatarLetter}
                    </div>
                    <div>
                      <div className="font-medium text-[#1D1B20] text-[15px]">{contact.name}</div>
                      <div className="text-xs text-[#49454F] mt-0.5">
                        {contact.type || 'Mobile'} {contact.number}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onInitiateCall(contact.number, contact.name);
                    }}
                    className="p-2.5 text-[#49454F] hover:text-[#1D1B20] active:scale-95 transition-transform rounded-full hover:bg-[#F2F1F8]"
                    aria-label={`Call ${contact.name}`}
                  >
                    <Phone className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Not in your contacts / Matched contact options - Screenshot 2 */
          <div className="space-y-4">
            <div className="text-xs font-semibold text-[#49454F] px-1">
              {matchedContact ? 'Matched contact' : 'Not in your contacts'}
            </div>

            {/* Match or Number card */}
            <div className="bg-white rounded-2xl p-3.5 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.04)] border border-[#ECEAF2]">
              <div className="flex items-center gap-3.5">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white text-base shadow-xs"
                  style={{ backgroundColor: matchedContact?.avatarColor || '#ECE6F0' }}
                >
                  {matchedContact ? (
                    <span className="font-medium">{matchedContact.avatarLetter}</span>
                  ) : (
                    <svg className="w-5 h-5 text-[#49454F]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-[#1D1B20] text-[16px]">
                    {matchedContact ? matchedContact.name : digits}
                  </div>
                  <div className="text-xs text-[#49454F] mt-0.5">
                    {matchedContact ? `${matchedContact.type || 'Mobile'} ${matchedContact.number}` : 'Recent inquiry'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onInitiateCall(digits, matchedContact?.name)}
                className="p-2.5 text-[#49454F] hover:text-[#1D1B20] active:scale-95 transition-transform rounded-full hover:bg-[#F2F1F8]"
                aria-label="Call"
              >
                <Phone className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions List - Screenshot 2 */}
            <div className="space-y-3 px-2">
              <button
                type="button"
                onClick={() => onCreateNewContact(digits)}
                className="flex items-center gap-3.5 text-[#3949AB] font-medium text-[15px] hover:opacity-80 active:scale-98 transition-transform w-full text-left"
              >
                <UserPlus className="w-5 h-5 text-[#3949AB]" />
                <span>Create new contact</span>
              </button>

              <button
                type="button"
                onClick={() => onCreateNewContact(digits)}
                className="flex items-center gap-3.5 text-[#3949AB] font-medium text-[15px] hover:opacity-80 active:scale-98 transition-transform w-full text-left"
              >
                <Plus className="w-5 h-5 text-[#3949AB]" />
                <span>Add to a contact</span>
              </button>

              <button
                type="button"
                onClick={() => alert(`Opening SMS compose for ${digits}`)}
                className="flex items-center gap-3.5 text-[#3949AB] font-medium text-[15px] hover:opacity-80 active:scale-98 transition-transform w-full text-left"
              >
                <MessageSquare className="w-5 h-5 text-[#3949AB]" />
                <span>Send a message</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Material You Dialpad Card (Bottom Sheet style) */}
      <div className="bg-[#EFEBFA] rounded-t-[32px] pt-2 pb-3 px-4 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] border-t border-[#E3DFEC]">
        {/* Dialed Number Display Area */}
        <div className="h-14 flex items-center justify-between px-2 mb-1">
          {/* Options button (left) */}
          <div className="w-10 flex items-center">
            {digits ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowOptions(!showOptions)}
                  className="p-2 text-[#49454F] hover:text-[#1D1B20] active:scale-90 transition-transform rounded-full"
                  aria-label="Options"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                {showOptions && (
                  <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-xl shadow-lg border border-[#E0DFE8] py-1 text-sm z-50 text-[#1D1B20]">
                    <button
                      type="button"
                      onClick={() => {
                        onDigitsChange(digits + ',');
                        setShowOptions(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#F2F1F8]"
                    >
                      Add 2-sec pause (,)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onDigitsChange(digits + ';');
                        setShowOptions(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#F2F1F8]"
                    >
                      Add wait (;)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(digits);
                        setShowOptions(false);
                        alert('Copied to clipboard');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#F2F1F8]"
                    >
                      Copy number
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Number Display (Center) */}
          <div className="flex-1 text-center truncate px-2">
            <span className="text-[28px] font-normal text-[#1D1B20] tracking-wide font-mono">
              {digits}
            </span>
          </div>

          {/* Backspace Button (Right) */}
          <div className="w-10 flex items-center justify-end">
            {digits ? (
              <button
                type="button"
                onClick={handleBackspace}
                onMouseDown={handleBackspaceMouseDown}
                onMouseUp={handleBackspaceMouseUp}
                onTouchStart={handleBackspaceMouseDown}
                onTouchEnd={handleBackspaceMouseUp}
                className="p-2 text-[#49454F] hover:text-[#1D1B20] active:scale-90 transition-transform rounded-full"
                aria-label="Backspace"
                title="Press to delete, hold to clear all"
              >
                <Delete className="w-6 h-6" />
              </button>
            ) : (
              <div className="w-6 h-6" />
            )}
          </div>
        </div>

        {/* 3x4 Grid of Dialpad Buttons */}
        <div className="grid grid-cols-3 gap-y-2 gap-x-4 px-2 max-w-md mx-auto">
          {KEYPAD_BUTTONS.map((btn) => (
            <button
              key={btn.digit}
              type="button"
              onClick={() => handleKeyPress(btn.digit)}
              onContextMenu={(e) => {
                if (btn.digit === '0') {
                  e.preventDefault();
                  handleZeroLongPress();
                }
              }}
              className="dial-btn bg-[#FFFFFF] hover:bg-[#F8F7FC] rounded-full h-[64px] flex flex-col items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.04)] border border-[#E7E4ED] transition-all cursor-pointer select-none"
            >
              <span className="text-[26px] font-normal leading-tight text-[#1D1B20]">
                {btn.digit}
              </span>
              <span className="text-[10px] font-medium tracking-widest text-[#79747E] leading-tight -mt-0.5">
                {btn.sub || '\u00A0'}
              </span>
            </button>
          ))}
        </div>

        {/* Call Button Row */}
        <div className="flex justify-center mt-3 mb-1">
          <button
            type="button"
            onClick={() => {
              if (digits) {
                onInitiateCall(digits, matchedContact?.name);
              } else if (contacts.length > 0) {
                // If empty and press call, recall last or first contact
                onDigitsChange(contacts[0].number);
              }
            }}
            className="w-[140px] h-[54px] rounded-full bg-[#1E8E3E] hover:bg-[#188038] active:scale-95 text-white flex items-center justify-center gap-2 shadow-[0_2px_6px_rgba(30,142,62,0.35)] transition-all cursor-pointer font-medium text-[16px]"
          >
            <Phone className="w-5 h-5 fill-current" />
            <span>Call</span>
          </button>
        </div>
      </div>
    </div>
  );
}
