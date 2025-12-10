'use client';

// ============================================
// VIBE SLIDES - Deck Manager Component
// ============================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen,
  Plus,
  Trash2,
  ChevronDown,
  FileText,
  Loader2,
  X,
} from 'lucide-react';
import { Deck } from '@/lib/types';

interface DeckManagerProps {
  decks: Deck[];
  currentDeckId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export function DeckManager({
  decks,
  currentDeckId,
  onSelect,
  onCreate,
  onDelete,
  isLoading = false,
}: DeckManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const currentDeck = decks.find((d) => d.id === currentDeckId);

  const handleCreate = () => {
    if (newDeckName.trim()) {
      onCreate(newDeckName.trim());
      setNewDeckName('');
      setIsCreating(false);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleteConfirm === id) {
      onDelete(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      // Auto-reset after 3 seconds
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  return (
    <div className="relative">
      {/* Dropdown trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center gap-3 px-4 py-2.5
          bg-slate-800/80 hover:bg-slate-700/80
          border border-slate-600/50 rounded-xl
          text-slate-200 font-medium
          transition-all duration-200
          min-w-[200px]
        "
      >
        <FolderOpen className="w-4 h-4 text-slate-400" />
        <span className="flex-1 text-left truncate">
          {isLoading ? 'Loading...' : currentDeck?.name || 'Select Deck'}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => {
                setIsOpen(false);
                setIsCreating(false);
              }}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="
                absolute top-full left-0 mt-2 z-50
                w-80 max-h-96 overflow-hidden
                bg-slate-800 border border-slate-600/50 rounded-xl
                shadow-2xl shadow-black/50
              "
            >
              {/* Create new deck */}
              <div className="p-2 border-b border-slate-700/50">
                {isCreating ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newDeckName}
                      onChange={(e) => setNewDeckName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                      placeholder="Deck name..."
                      className="
                        flex-1 px-3 py-2 bg-slate-900/50 rounded-lg
                        text-slate-200 text-sm placeholder:text-slate-500
                        border border-slate-600/50 focus:border-emerald-500/50
                        outline-none
                      "
                      autoFocus
                    />
                    <button
                      onClick={handleCreate}
                      disabled={!newDeckName.trim()}
                      className="p-2 bg-emerald-600 rounded-lg text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setIsCreating(false);
                        setNewDeckName('');
                      }}
                      className="p-2 bg-slate-700 rounded-lg text-slate-300 hover:bg-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsCreating(true)}
                    className="
                      w-full flex items-center gap-2 px-3 py-2
                      text-emerald-400 hover:text-emerald-300
                      hover:bg-emerald-500/10 rounded-lg
                      transition-colors text-sm font-medium
                    "
                  >
                    <Plus className="w-4 h-4" />
                    Create New Deck
                  </button>
                )}
              </div>

              {/* Deck list */}
              <div className="overflow-y-auto max-h-72 p-2 space-y-1">
                {decks.length === 0 ? (
                  <div className="px-3 py-8 text-center text-slate-500">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No decks yet</p>
                    <p className="text-xs mt-1">Create one to get started</p>
                  </div>
                ) : (
                  decks.map((deck) => (
                    <motion.div
                      key={deck.id}
                      layout
                      className={`
                        group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer
                        transition-colors
                        ${
                          deck.id === currentDeckId
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'hover:bg-slate-700/50 text-slate-300'
                        }
                      `}
                      onClick={() => {
                        onSelect(deck.id);
                        setIsOpen(false);
                      }}
                    >
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{deck.name}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(deck.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDelete(deck.id, e)}
                        className={`
                          p-1.5 rounded-md transition-all opacity-0 group-hover:opacity-100
                          ${
                            deleteConfirm === deck.id
                              ? 'bg-red-500 text-white'
                              : 'hover:bg-red-500/20 text-slate-400 hover:text-red-400'
                          }
                        `}
                        title={deleteConfirm === deck.id ? 'Click again to confirm' : 'Delete deck'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
