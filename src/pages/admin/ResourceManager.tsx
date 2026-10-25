import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminDelete, adminList, adminSave, type AdminListInputType } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Textarea } from '@project/components/ui/textarea';
import { Switch } from '@project/components/ui/switch';
import { Skeleton } from '@project/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@project/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@project/components/ui/alert-dialog';
import UploadField from '../../components/UploadField';
import { errMsg } from '../../lib/util';

export type Table = AdminListInputType['table'];
export type Row = Record<string, any>;
export type Field = {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'percent' | 'select' | 'checkbox' | 'upload' | 'link' | 'date' | 'readonly';
  options?: string[];
  linkTable?: Table;
  linkLabel?: string;
  accept?: string;
  required?: boolean;
  full?: boolean;
};
export type Column = { key: string; label: string; render?: (r: Row) => ReactNode };

const first = (v: unknown) => (Array.isArray(v) ? v[0] : v) ?? '';
const PAGE = 15;

function useLinkOptions(fields: Field[]) {
  const [opts, setOpts] = useState<Record<string, { id: string; label: string }[]>>({});
  useEffect(() => {
    fields.filter((f) => f.type === 'link' && f.linkTable).forEach((f) =>
      adminList({ table: f.linkTable! }).then((r) =>
        setOpts((o) => ({ ...o, [f.key]: r.records.map((x) => ({ id: String(x.id), label: String(x[f.linkLabel ?? 'title'] ?? x.id) })) })),
      ),
    );
  }, [fields]);
  return opts;
}

function FieldInput({ f, value, onChange, linkOpts }: { f: Field; value: any; onChange: (v: any) => void; linkOpts?: { id: string; label: string }[] }) {
  switch (f.type) {
    case 'textarea': return <Textarea rows={4} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'number': return <Input type="number" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />;
    case 'percent': return <Input type="number" value={value === '' || value == null ? '' : Math.round(Number(value) * 100)} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value) / 100)} placeholder="%" />;
    case 'checkbox': return <div className="pt-1"><Switch checked={!!value} onCheckedChange={onChange} /></div>;
    case 'upload': return <UploadField value={value ?? ''} onChange={onChange} accept={f.accept} />;
    case 'date': return <Input type="date" value={(value ?? '').slice(0, 10)} onChange={(e) => onChange(e.target.value)} />;
    case 'readonly': return <Input value={value ?? ''} disabled />;
    case 'select':
    case 'link': {
      const items = f.type === 'link' ? linkOpts ?? [] : (f.options ?? []).map((o) => ({ id: o, label: o }));
      const v = f.type === 'link' ? String(first(value)) : String(value ?? '');
      return (
        <Select value={v || undefined} onValueChange={(x) => onChange(x === '__none' ? '' : x)}>
          <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">— None —</SelectItem>
            {items.map((i) => <SelectItem key={i.id} value={i.id}>{i.label}</SelectItem>)}
          </SelectContent>
        </Select>
      );
    }
    default: return <Input value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
  }
}

export default function ResourceManager({
  table, title, fields, columns, defaults = {}, rowActions, canCreate = true, searchKeys, onChanged,
}: {
  table: Table; title: string; fields: Field[]; columns: Column[]; defaults?: Row;
  rowActions?: (r: Row, reload: () => void) => ReactNode; canCreate?: boolean; searchKeys?: string[]; onChanged?: () => void;
}) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 }>({ key: columns[0].key, dir: 1 });
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Row | null>(null);
  const [del, setDel] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const linkOpts = useLinkOptions(fields);

  const load = () => adminList({ table }).then((r) => setRows(r.records)).catch((e) => toast.error(errMsg(e)));
  useEffect(() => void load(), [table]); // eslint-disable-line react-hooks/exhaustive-deps

  const view = useMemo(() => {
    const keys = searchKeys ?? columns.map((c) => c.key);
    const filtered = (rows ?? []).filter((r) => !q || keys.some((k) => String(r[k] ?? '').toLowerCase().includes(q.toLowerCase())));
    return filtered.sort((a, b) => {
      const x = a[sort.key] ?? '', y = b[sort.key] ?? '';
      return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))) * sort.dir;
    });
  }, [rows, q, sort, columns, searchKeys]);
  const pages = Math.max(1, Math.ceil(view.length / PAGE));
  const slice = view.slice(page * PAGE, page * PAGE + PAGE);

  const missing = editing ? fields.filter((f) => f.required && (editing[f.key] === '' || editing[f.key] == null)) : [];
  const save = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      const record: Row = {};
      for (const f of fields) if (f.type !== 'readonly') record[f.key] = f.type === 'link' ? (first(editing[f.key]) || null) : editing[f.key] ?? null;
      await adminSave({ table, id: editing.id, record });
      toast.success('Saved');
      setEditing(null);
      load();
      onChanged?.();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!del) return;
    try { await adminDelete({ table, id: del.id }); toast.success('Deleted'); load(); onChanged?.(); } catch (e) { toast.error(errMsg(e)); } finally { setDel(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <h2 className="font-display text-3xl">{title} <span className="text-muted-foreground text-xl">({rows?.length ?? '…'})</span></h2>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} className="pl-9" />
          </div>
          {canCreate && <Button onClick={() => setEditing({ ...defaults })}><Plus className="h-4 w-4" /><span className="hidden sm:inline">Add</span></Button>}
        </div>
      </div>
      <div className="neon-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {columns.map((c) => (
                <th key={c.key} className="text-left font-tech text-[0.6rem] uppercase tracking-widest text-muted-foreground p-3 whitespace-nowrap">
                  <button className="flex items-center gap-1 hover:text-primary" onClick={() => setSort({ key: c.key, dir: sort.key === c.key ? (sort.dir === 1 ? -1 : 1) : 1 })}>
                    {c.label}<ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
              ))}
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {!rows && <tr><td colSpan={columns.length + 1} className="p-3"><Skeleton className="h-24" /></td></tr>}
            {rows && slice.length === 0 && <tr><td colSpan={columns.length + 1} className="p-8 text-center text-muted-foreground">Nothing here yet.</td></tr>}
            {slice.map((r) => (
              <tr key={r.id} className="border-b border-border/60 hover:bg-secondary/40">
                {columns.map((c) => <td key={c.key} className="p-3 max-w-[260px] truncate">{c.render ? c.render(r) : String(r[c.key] ?? '')}</td>)}
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    {rowActions?.(r, load)}
                    <Button size="icon" variant="ghost" onClick={() => setEditing({ ...r })} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDel(r)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <Button size="icon" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span>{page + 1} / {pages}</span>
          <Button size="icon" variant="outline" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? 'Edit' : 'Add'} {title.replace(/s$/, '')}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid sm:grid-cols-2 gap-4">
              {fields.map((f) => (
                <div key={f.key} className={f.full || f.type === 'textarea' || f.type === 'upload' ? 'sm:col-span-2' : ''}>
                  <Label>{f.label}{f.required && ' *'}</Label>
                  <FieldInput f={f} value={editing[f.key]} linkOpts={linkOpts[f.key]} onChange={(v) => setEditing({ ...editing, [f.key]: v })} />
                </div>
              ))}
              {missing.length > 0 && <p className="sm:col-span-2 text-xs text-destructive">Required: {missing.map((m) => m.label).join(', ')}</p>}
              <Button className="sm:col-span-2" onClick={save} disabled={busy || missing.length > 0}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Save</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete permanently?</AlertDialogTitle><AlertDialogDescription>This can't be undone{table === 'profiles' ? '. Their ads, pledges and subscription will also be removed.' : '.'}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={remove}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
