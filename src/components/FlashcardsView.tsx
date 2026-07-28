import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { Flashcard } from '../types';

interface FlashcardsViewProps {
  isOpen: boolean;
  onClose: () => void;
  flashcards: Flashcard[];
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  isOpen,
  onClose,
  flashcards
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  if (flashcards.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-6 w-full max-w-md text-center space-y-4">
          <BookOpen className="w-12 h-12 text-indigo-400 mx-auto" />
          <h3 className="text-lg font-bold">No Flashcards Available</h3>
          <p className="text-xs text-slate-400">
            Click the <strong className="text-purple-300">"AI Study Guide"</strong> button in the top bar to generate flashcard review questions from your notes!
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium text-xs w-full"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const current = flashcards[currentIndex];
  const isMastered = masteredIds.has(current.id);

  const toggleMastered = () => {
    setMasteredIds(prev => {
      const next = new Set(prev);
      if (next.has(current.id)) {
        next.delete(current.id);
      } else {
        next.add(current.id);
      }
      return next;
    });
  };

  const nextCard = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm sm:text-base font-bold">Student Revision Flashcards</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Card <strong className="text-white">{currentIndex + 1}</strong> of <strong className="text-white">{flashcards.length}</strong>
          </span>
          <span className="text-emerald-400 font-mono">
            {masteredIds.size} Mastered
          </span>
        </div>

        {/* Card Arena */}
        <div className="p-6 flex-1 flex flex-col items-center justify-center min-h-[280px]">
          
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className={`w-full p-8 rounded-2xl border cursor-pointer transition-all duration-300 min-h-[200px] flex flex-col justify-between shadow-xl relative select-none ${
              isFlipped
                ? 'bg-purple-950/40 border-purple-500/60 text-purple-100'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-100'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-indigo-400">
                {current.chapterTitle || 'Revision'}
              </span>
              <span className="flex items-center gap-1 font-mono text-[10px] text-slate-500">
                <RotateCw className="w-3 h-3" /> Click to Flip
              </span>
            </div>

            <div className="my-6 text-center">
              {!isFlipped ? (
                <div>
                  <span className="text-xs uppercase tracking-widest text-indigo-400 font-bold block mb-2">Question</span>
                  <p className="text-base sm:text-lg font-semibold leading-relaxed">
                    {current.question}
                  </p>
                </div>
              ) : (
                <div>
                  <span className="text-xs uppercase tracking-widest text-purple-400 font-bold block mb-2">Answer & Explanation</span>
                  <p className="text-sm sm:text-base leading-relaxed text-purple-200">
                    {current.answer}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMastered();
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  isMastered
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isMastered ? 'Mastered!' : 'Mark as Mastered'}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer Navigation Controls */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={prevCard}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <button
            onClick={nextCard}
            className="flex items-center gap-1 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30"
          >
            <span>Next Card</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
