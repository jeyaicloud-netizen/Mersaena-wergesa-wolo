import { useState, useEffect, FormEvent } from 'react';
import { X, User, Phone, Check } from 'lucide-react';
import { Contact } from '../types';

interface NewContactModalProps {
  isOpen: boolean;
  initialNumber?: string;
  onClose: () => void;
  onSave: (contact: Omit<Contact, 'id'>) => void;
}

const AVATAR_COLORS = [
  '#BA68C8', // Purple
  '#26C6DA', // Teal
  '#FBC02D', // Gold
  '#EF9A9A', // Salmon
  '#81C784', // Green
  '#64B5F6', // Blue
  '#FF8A65', // Coral
];

export default function NewContactModal({
  isOpen,
  initialNumber = '',
  onClose,
  onSave,
}: NewContactModalProps) {
  const [name, setName] = useState('');
  const [number, setNumber] = useState(initialNumber);
  const [type, setType] = useState<'Mobile' | 'Work' | 'Home'>('Mobile');
  const [color, setColor] = useState(AVATAR_COLORS[0]);

  useEffect(() => {
    if (initialNumber) {
      setNumber(initialNumber);
    }
  }, [initialNumber]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !number.trim()) return;

    const trimmedName = name.trim();
    const avatarLetter = trimmedName.charAt(0).toUpperCase();

    onSave({
      name: trimmedName,
      number: number.trim(),
      avatarLetter,
      avatarColor: color,
      type,
    });

    setName('');
    setNumber('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-[#F4F3F8] rounded-[28px] p-6 shadow-2xl border border-[#E0DFE8] space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-medium text-[#1D1B20]">Create contact</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#49454F] hover:text-[#1D1B20] rounded-full active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contact Avatar preview */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-white text-2xl shadow-md transition-colors"
            style={{ backgroundColor: color }}
          >
            {name.trim() ? name.trim().charAt(0).toUpperCase() : <User className="w-8 h-8" />}
          </div>

          <div className="flex items-center gap-2">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full transition-transform ${
                  color === c ? 'scale-125 ring-2 ring-[#3949AB]' : 'opacity-80 hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#49454F] px-1">Name</label>
            <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 border border-[#E0DFE8]">
              <User className="w-4 h-4 text-[#79747E]" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contact name"
                className="w-full bg-transparent text-[#1D1B20] outline-none text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#49454F] px-1">Phone number</label>
            <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 border border-[#E0DFE8]">
              <Phone className="w-4 h-4 text-[#79747E]" />
              <input
                type="tel"
                required
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="e.g. +2519..."
                className="w-full bg-transparent text-[#1D1B20] outline-none text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#49454F] px-1">Label</label>
            <div className="flex gap-2">
              {(['Mobile', 'Work', 'Home'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    type === t
                      ? 'bg-[#E2DEFE] border-[#C3BCF8] text-[#1E192B]'
                      : 'bg-white border-[#E0DFE8] text-[#49454F]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#49454F] hover:bg-black/5 rounded-full"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-medium text-white bg-[#1E8E3E] hover:bg-[#188038] rounded-full shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
