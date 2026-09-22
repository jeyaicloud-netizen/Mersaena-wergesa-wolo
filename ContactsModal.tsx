import { useState } from 'react';
import { Contact } from '../types';
import { X, Search, Phone, Plus, UserX } from 'lucide-react';

interface ContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  onStartCall: (number: string, name?: string) => void;
  onOpenCreateContact: () => void;
  onDeleteContact: (id: string) => void;
}

export default function ContactsModal({
  isOpen,
  onClose,
  contacts,
  onStartCall,
  onOpenCreateContact,
  onDeleteContact,
}: ContactsModalProps) {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.number.includes(query)
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-[80vh] bg-[#F4F3F8] rounded-[28px] p-5 shadow-2xl border border-[#E0DFE8] flex flex-col space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-medium text-[#1D1B20]">Contacts</h3>
            <span className="text-xs bg-[#E2DEFE] text-[#1E192B] font-semibold px-2 py-0.5 rounded-full">
              {contacts.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onOpenCreateContact}
              className="p-2 text-[#3949AB] hover:bg-white rounded-full transition-colors active:scale-90"
              title="Add contact"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#49454F] hover:text-[#1D1B20] rounded-full active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-[#E0DFE8]">
          <Search className="w-4 h-4 text-[#79747E]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts"
            className="w-full bg-transparent text-sm text-[#1D1B20] outline-none"
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl p-3 flex items-center justify-between shadow-xs border border-[#ECEAF2]"
            >
              <div
                className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                onClick={() => {
                  onClose();
                  onStartCall(c.number, c.name);
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-medium text-white text-sm shrink-0"
                  style={{ backgroundColor: c.avatarColor }}
                >
                  {c.avatarLetter}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-[#1D1B20] text-[15px] truncate">
                    {c.name}
                  </div>
                  <div className="text-xs text-[#49454F]">{c.number}</div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartCall(c.number, c.name);
                  }}
                  className="p-2 text-[#00897B] hover:bg-[#F2F1F8] rounded-full active:scale-90"
                  title="Call"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteContact(c.id)}
                  className="p-2 text-[#B3261E]/70 hover:text-[#B3261E] hover:bg-[#F2F1F8] rounded-full active:scale-90"
                  title="Delete"
                >
                  <UserX className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-sm text-[#79747E]">
              No contacts found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
