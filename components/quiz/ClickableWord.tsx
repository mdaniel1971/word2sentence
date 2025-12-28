'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface ClickableWordProps {
  word: string;
  deckId: string;
  sourceLanguage: string;
  targetLanguage: string;
  isRtl: boolean;
  onWordSaved?: () => void;
}

export function ClickableWord({ 
  word, 
  deckId, 
  sourceLanguage, 
  targetLanguage, 
  isRtl,
  onWordSaved 
}: ClickableWordProps) {
  const [showPopover, setShowPopover] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) &&
        wordRef.current &&
        !wordRef.current.contains(event.target as Node)
      ) {
        setShowPopover(false);
        setMessage(null);
      }
    }

    if (showPopover) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPopover]);

  const handleWordClick = () => {
    setShowPopover(true);
    setMessage(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/save-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word,
          deckId,
          sourceLanguage,
          targetLanguage,
        }),
      });

      const result = await response.json();

      if (result.exists) {
        setMessage({ type: 'info', text: result.message });
      } else if (result.success) {
        setMessage({ type: 'success', text: result.message });
        onWordSaved?.();
        // Auto-close after success
        setTimeout(() => {
          setShowPopover(false);
          setMessage(null);
        }, 2000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save word' });
      }
    } catch (error) {
      console.error('Error saving word:', error);
      setMessage({ type: 'error', text: 'Failed to save word' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setShowPopover(false);
    setMessage(null);
  };

  return (
    <span className="relative inline-block">
      <span
        ref={wordRef}
        onClick={handleWordClick}
        className={`cursor-pointer hover:bg-amber-500/20 hover:text-amber-300 rounded px-0.5 transition-colors ${
          showPopover ? 'bg-amber-500/30 text-amber-300' : ''
        }`}
      >
        {word}
      </span>
      
      {showPopover && (
        <div
          ref={popoverRef}
          className={`absolute z-50 mt-2 p-3 bg-stone-800 border border-stone-700 rounded-lg shadow-xl min-w-[180px] ${
            isRtl ? 'right-0' : 'left-0'
          }`}
          style={{ top: '100%' }}
        >
          {message ? (
            <div className={`text-sm ${
              message.type === 'success' ? 'text-emerald-400' : 
              message.type === 'error' ? 'text-red-400' : 
              'text-amber-400'
            }`}>
              {message.text}
            </div>
          ) : (
            <>
              <p className="text-stone-300 text-sm mb-3">Save to words?</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1 h-7"
                >
                  {saving ? (
                    <span className="flex items-center gap-1">
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    'Yes'
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                  className="border-stone-600 text-stone-400 hover:bg-stone-700 text-xs px-3 py-1 h-7"
                >
                  No
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </span>
  );
}

interface ClickableSentenceProps {
  sentence: string;
  deckId: string;
  sourceLanguage: string;
  targetLanguage: string;
  isRtl: boolean;
  onWordSaved?: () => void;
}

export function ClickableSentence({
  sentence,
  deckId,
  sourceLanguage,
  targetLanguage,
  isRtl,
  onWordSaved,
}: ClickableSentenceProps) {
  // Split sentence into words while preserving spaces and punctuation
  const parts = sentence.split(/(\s+)/);
  
  return (
    <span>
      {parts.map((part, index) => {
        // Check if this is a word (not whitespace or punctuation only)
        const isWord = /[\u0600-\u06FF\w]+/.test(part);
        
        if (isWord) {
          return (
            <ClickableWord
              key={index}
              word={part}
              deckId={deckId}
              sourceLanguage={sourceLanguage}
              targetLanguage={targetLanguage}
              isRtl={isRtl}
              onWordSaved={onWordSaved}
            />
          );
        }
        
        // Return spaces and punctuation as-is
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
