'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/ui/badge';
import { Input } from '@/ui/input';

interface ActorIdsInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ActorIdsInput({ value = [], onChange, disabled, placeholder = 'Add actor ID...' }: ActorIdsInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addActorId = (id: string) => {
    const trimmed = id.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputValue('');
  };

  const removeActorId = (id: string) => {
    onChange(value.filter((v) => v !== id));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addActorId(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // Remove last item when backspace is pressed on empty input
      removeActorId(value[value.length - 1]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    // Check if pasted text contains commas (likely a list)
    if (pastedText.includes(',')) {
      e.preventDefault();
      const ids = pastedText
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id && !value.includes(id));
      if (ids.length > 0) {
        onChange([...value, ...ids]);
      }
    }
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div
      className="border-input bg-background ring-offset-background focus-within:ring-ring flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-offset-2"
      onClick={handleContainerClick}
    >
      {value.map((id) => (
        <Badge key={id} variant="secondary" className="gap-1 pr-1">
          {id}
          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeActorId(id);
              }}
              className="hover:bg-muted-foreground/20 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Badge>
      ))}
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={() => {
          if (inputValue.trim()) {
            addActorId(inputValue);
          }
        }}
        disabled={disabled}
        placeholder={value.length === 0 ? placeholder : ''}
        className="h-auto min-w-[120px] flex-1 border-0 p-0 shadow-none focus-visible:ring-0"
      />
    </div>
  );
}
