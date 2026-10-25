import { useRef } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useUpload } from 'zitejs/upload';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';

export default function UploadField({ value, onChange, accept, placeholder }: { value: string; onChange: (v: string) => void; accept?: string; placeholder?: string }) {
  const { upload, isUploading } = useUpload();
  const ref = useRef<HTMLInputElement>(null);
  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const { url } = await upload(f);
      onChange(url);
      toast.success('Uploaded');
    } catch {
      toast.error('Upload failed');
    } finally {
      e.target.value = '';
    }
  };
  return (
    <div className="flex gap-2">
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder ?? 'Paste a URL or upload'} />
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={pick} />
      <Button type="button" variant="outline" onClick={() => ref.current?.click()} disabled={isUploading}>
        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
      </Button>
    </div>
  );
}
