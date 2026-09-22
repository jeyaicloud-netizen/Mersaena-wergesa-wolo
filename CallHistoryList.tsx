import { useState } from 'react';
import { CallLog, Contact } from '../types';
import { Phone, ChevronDown, Mic, MessageSquare, UserPlus, Info, Trash2 } from 'lucide-react';

interface CallHistoryListProps {
  callLogs: CallLog[];
  contacts: Contact[];
  onStartCall: (number: string, name?: string) => void;
  onOpenContacts: () => void;
  onDeleteLog: (id: string) => void;
  onCreateContactFromNumber?: (num: string) => void;
}

export default function CallHistoryList({
  callLogs,
  contacts,
  onStartCall,
  onOpenContacts,
  onDeleteLog,
  onCreateContactFromNumber,
}: CallHistoryListProps) {
  const [favouritesOpen, setFavouritesOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Group by dateGroup
  const todayLogs = callLogs.filter((l) => l.dateGroup === 'Today');
  const yesterdayLogs = callLogs.filter((l) => l.dateGroup === 'Yesterday');
  const olderLogs = callLogs.filter((l) => l.dateGroup === 'Older');

  const renderLogItem = (log: CallLog) => {
    const isExpanded = expandedId === log.id;
    // Check if matching contact exists
    const matchingContact = contacts.find(
      (c) => c.number === log.number || c.name === log.name
    );

    const displayName = log.name || matchingContact?.name || log.number;
    const countSuffix = log.count && log.count > 1 ? ` (${log.count})` : '';

    return (
      <div
        key={log.id}
        className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] border border-[#ECEAF2] overflow-hidden transition-all duration-150"
      >
        <div
          className="p-3.5 flex items-center justify-between cursor-pointer active:bg-[#F6F5FA]"
          onClick={() => setExpandedId(isExpanded ? null : log.id)}
        >
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            {/* Avatar */}
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center font-medium text-white text-base shrink-0 shadow-sm"
              style={{
                backgroundColor:
                  log.avatarColor || matchingContact?.avatarColor || '#ECE6F0',
                color: log.avatarColor || matchingContact?.avatarColor ? '#FFFFFF' : '#49454F',
              }}
            >
              {log.avatarLetter || matchingContact?.avatarLetter || (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-[#1D1B20] text-[16px] truncate">
                  {displayName}
                  <span className="font-normal text-[#49454F]">{countSuffix}</span>
                </span>
                {log.hasRecording && (
                  <Mic className="w-3.5 h-3.5 text-[#49454F] shrink-0" />
                )}
              </div>

              {/* Direction, time, and carrier */}
              <div className="flex items-center gap-1.5 text-xs text-[#49454F] mt-0.5">
                {/* Arrow indicator */}
                {log.direction === 'outgoing' && (
                  <span className="text-[13px] text-[#49454F] font-bold">↗</span>
                )}
                {log.direction === 'incoming' && (
                  <span className="text-[13px] text-[#00897B] font-bold">↙</span>
                )}
                {log.direction === 'missed' && (
                  <span className="text-[13px] text-[#B3261E] font-bold">↙</span>
                )}

                <span>{log.timeAgo || log.timestamp}</span>
              </div>

              <div className="text-[12px] text-[#00897B] font-medium mt-0.5">
                {log.carrier || 'Ethio telecom'}
              </div>
            </div>
          </div>

          {/* Direct Call Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStartCall(log.number, log.name || matchingContact?.name);
            }}
            className="p-2.5 text-[#49454F] hover:text-[#1D1B20] active:scale-95 transition-transform rounded-full hover:bg-[#F2F1F8]"
            aria-label="Call"
          >
            <Phone className="w-5 h-5" />
          </button>
        </div>

        {/* Expanded Row Actions */}
        {isExpanded && (
          <div className="px-4 py-2.5 bg-[#F9F8FD] border-t border-[#ECEAF2] flex items-center justify-around text-xs text-[#49454F]">
            <button
              type="button"
              onClick={() => onStartCall(log.number, log.name)}
              className="flex flex-col items-center gap-1 py-1 px-2 rounded-lg hover:bg-white"
            >
              <Phone className="w-4 h-4 text-[#00897B]" />
              <span>Call</span>
            </button>
            <button
              type="button"
              onClick={() => {
                alert(`Opening SMS message to ${log.number}`);
              }}
              className="flex flex-col items-center gap-1 py-1 px-2 rounded-lg hover:bg-white"
            >
              <MessageSquare className="w-4 h-4 text-[#3949AB]" />
              <span>Message</span>
            </button>
            {!matchingContact && (
              <button
                type="button"
                onClick={() => onCreateContactFromNumber?.(log.number)}
                className="flex flex-col items-center gap-1 py-1 px-2 rounded-lg hover:bg-white"
              >
                <UserPlus className="w-4 h-4 text-[#7B1FA2]" />
                <span>Add Contact</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onDeleteLog(log.id)}
              className="flex flex-col items-center gap-1 py-1 px-2 rounded-lg hover:bg-white text-[#B3261E]"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full px-4 pb-28 space-y-4">
      {/* Favourites Header Bar */}
      <div className="flex items-center justify-between py-1 text-sm font-medium text-[#49454F]">
        <button
          type="button"
          onClick={() => setFavouritesOpen(!favouritesOpen)}
          className="flex items-center gap-1 hover:text-[#1D1B20]"
        >
          <span>Favourites</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              favouritesOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        <button
          type="button"
          onClick={onOpenContacts}
          className="text-xs text-[#3949AB] font-medium hover:underline"
        >
          View contacts
        </button>
      </div>

      {/* Favourites dropdown section */}
      {favouritesOpen && (
        <div className="grid grid-cols-4 gap-3 py-2">
          {contacts.slice(0, 4).map((c) => (
            <button
              key={c.id}
              onClick={() => onStartCall(c.number, c.name)}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-white border border-[#E9E7EF] shadow-xs active:scale-95 transition-transform"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-sm"
                style={{ backgroundColor: c.avatarColor }}
              >
                {c.avatarLetter}
              </div>
              <span className="text-xs font-medium text-[#1D1B20] truncate w-full text-center">
                {c.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Today Section */}
      {todayLogs.length > 0 && (
        <div className="space-y-2.5">
          <div className="text-xs font-semibold text-[#49454F] px-1">Today</div>
          <div className="space-y-2">
            {todayLogs.map(renderLogItem)}
          </div>
        </div>
      )}

      {/* Yesterday Section */}
      {yesterdayLogs.length > 0 && (
        <div className="space-y-2.5 pt-2">
          <div className="text-xs font-semibold text-[#49454F] px-1">Yesterday</div>
          <div className="space-y-2">
            {yesterdayLogs.map(renderLogItem)}
          </div>
        </div>
      )}

      {/* Older Section */}
      {olderLogs.length > 0 && (
        <div className="space-y-2.5 pt-2">
          <div className="text-xs font-semibold text-[#49454F] px-1">Older</div>
          <div className="space-y-2">
            {olderLogs.map(renderLogItem)}
          </div>
        </div>
      )}

      {callLogs.length === 0 && (
        <div className="text-center py-12 text-[#79747E] space-y-2">
          <Phone className="w-10 h-10 mx-auto opacity-40 text-[#49454F]" />
          <p className="text-sm">No recent calls</p>
        </div>
      )}
    </div>
  );
}
