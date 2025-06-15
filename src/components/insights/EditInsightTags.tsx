
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Check, X } from 'lucide-react';

interface EditInsightTagsProps {
  initialValue: string;
  onSave: (value: string) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export const EditInsightTags = ({ initialValue, onSave, onCancel, isSaving }: EditInsightTagsProps) => {
  const [tagInputValue, setTagInputValue] = useState(initialValue);

  const handleSave = () => {
    onSave(tagInputValue);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Tags separadas por vírgula"
          value={tagInputValue}
          onChange={(e) => setTagInputValue(e.target.value)}
          className="bg-white/80 h-8 text-sm flex-grow"
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <Button size="icon" className="h-8 w-8 flex-shrink-0" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-gray-500">Pressione Enter para salvar ou Esc para cancelar.</p>
    </div>
  );
};
