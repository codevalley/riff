'use client';

// ============================================
// RIFF - Deck Manager Component
// Minimal, Vercel-inspired design
// ============================================

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  FileText,
  Trash2,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { Deck } from '@/lib/types';

interface DeckManagerProps {
  decks: Deck[];
  currentDeckId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  isLoading?: boolean;
}

export function DeckManager({
  decks,
  currentDeckId,
  onSelect,
  onDelete,
  onRename,
  isLoading = false,
}: DeckManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  const currentDeck = decks.find((d) => d.id === currentDeckId);

  // Focus input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const startEditing = (deck: Deck, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(deck.id);
    setEditName(deck.name);
    setDeleteConfirm(null);
  };

  const handleRename = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (editingId && editName.trim()) {
      onRename(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditName('');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleteConfirm === id) {
      onDelete(id);
      setDeleteConfirm(null);
      setIsOpen(false); // Close dropdown after deletion
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  return (
    <div className="relative">
      {/* Dropdown trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center gap-2.5 px-3 py-2
          bg-transparent hover:bg-surface
          border border-border hover:border-border-hover
          rounded-md text-text-secondary hover:text-text-primary
          transition-all duration-fast
          min-w-[180px]
        "
      >
        <FileText className="w-4 h-4 text-text-tertiary" />
        <span className="flex-1 text-left text-sm truncate">
          {isLoading ? 'Loading...' : currentDeck?.name || 'Select Deck'}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-text-tertiary transition-transform duration-fast ${
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
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.1 }}
              className="
                absolute top-full left-0 mt-1.5 z-50
                w-72 max-h-96 overflow-hidden
                bg-surface border border-border rounded-lg
                shadow-xl shadow-black/20
              "
            >
              {/* Deck list */}
              <div className="overflow-y-auto max-h-72 p-1.5">
                {decks.length === 0 ? (
                  <div className="px-3 py-6 text-center">
                    <FileText className="w-6 h-6 mx-auto mb-2 text-text-quaternary" />
                    <p className="text-sm text-text-tertiary">No decks yet</p>
                    <p className="text-xs mt-0.5 text-text-quaternary">
                      Create one to get started
                    </p>
                  </div>
                ) : (
                  decks.map((deck) => (
                    <motion.div
                      key={deck.id}
                      layout
                      className={`
                        group flex items-center gap-2.5 px-2.5 py-2 rounded-md cursor-pointer
                        transition-colors
                        ${
                          deck.id === currentDeckId
                            ? 'bg-surface-hover text-text-primary'
                            : 'hover:bg-surface-hover text-text-secondary hover:text-text-primary'
                        }
                      `}
                      onClick={() => {
                        if (editingId !== deck.id) {
                          onSelect(deck.id);
                          setIsOpen(false);
                        }
                      }}
                    >
                      <FileText className="w-4 h-4 flex-shrink-0 text-text-tertiary" />
                      <div className="flex-1 min-w-0">
                        {editingId === deck.id ? (
                          <form onSubmit={handleRename} className="flex items-center gap-1">
                            <input
                              ref={editInputRef}
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  setEditingId(null);
                                  setEditName('');
                                }
                              }}
                              className="flex-1 px-1.5 py-0.5 text-sm bg-background border border-border rounded text-text-primary focus:border-border-focus outline-none"
                            />
                            <button
                              type="submit"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 rounded hover:bg-success/10 text-success"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditing}
                              className="p-1 rounded hover:bg-error/10 text-text-quaternary hover:text-error"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        ) : (
                          <>
                            <p className="text-sm truncate">{deck.name}</p>
                            <p className="text-xs text-text-quaternary">
                              {new Date(deck.updatedAt).toLocaleDateString()}
                            </p>
                          </>
                        )}
                      </div>
                      {editingId !== deck.id && (
                        <>
                          <button
                            onClick={(e) => startEditing(deck, e)}
                            className="p-1 rounded transition-all opacity-0 group-hover:opacity-100 hover:bg-surface text-text-quaternary hover:text-text-primary"
                            title="Rename"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(deck.id, e)}
                            className={`
                              p-1 rounded transition-all opacity-0 group-hover:opacity-100
                              ${
                                deleteConfirm === deck.id
                                  ? 'bg-error text-white opacity-100'
                                  : 'hover:bg-error/10 text-text-quaternary hover:text-error'
                              }
                            `}
                            title={deleteConfirm === deck.id ? 'Click to confirm' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
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
