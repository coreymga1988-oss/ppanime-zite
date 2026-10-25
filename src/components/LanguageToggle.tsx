import { Languages } from 'lucide-react';
import { cn } from '@project/components/lib/utils';
import { useLang, type Lang } from '../lib/i18n';

const OPTIONS: { value: Lang; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'ja', label: '日本語' },
];

export default function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div className={cn('flex items-center gap-1 rounded-md border border-border p-0.5', className)} role="group" aria-label="Language / 言語">
      <Languages className="h-3.5 w-3.5 mx-1 text-muted-foreground" />
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          onClick={() => setLang(o.value)}
          aria-pressed={lang === o.value}
          className={cn(
            'font-tech text-[0.65rem] tracking-widest px-2 py-1 rounded transition-colors',
            lang === o.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-primary',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
