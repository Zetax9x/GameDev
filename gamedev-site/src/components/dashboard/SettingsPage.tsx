import { useEffect, useState, type ChangeEvent } from 'react';
import type { Settings } from '../../lib/types';
import { CATEGORY_LABELS, type Category } from '../../lib/categories';
import { api, errorMessage } from './api';
import { useApi } from './useApi';
import { Card, ErrorBox, Loading, inputClass } from './ui';
import { duration, longDate } from './format';

interface ImportResult {
  dryRun: boolean;
  total: number;
  valid: number;
  imported: number;
  invalid: { line: number; error?: string }[];
  preview: { date: string; minutes: number; category: string; note: string | null }[];
  totalMinutes: number;
}

export default function SettingsPage() {
  const { data, setData, error, loading, reload } = useApi<{ settings: Settings }>('/api/private/settings');

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return null;

  return (
    <div className="space-y-5">
      <PlanSettings settings={data.settings} onSaved={(settings) => setData({ settings })} />
      <ExportCard />
      <ImportCard />
    </div>
  );
}

function PlanSettings({ settings, onSaved }: { settings: Settings; onSaved: (s: Settings) => void }) {
  const [startDate, setStartDate] = useState(settings.start_date);
  const [target, setTarget] = useState(String(settings.weekly_target_hours));
  const [showHours, setShowHours] = useState(settings.public_show_hours);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    setStartDate(settings.start_date);
    setTarget(String(settings.weekly_target_hours));
    setShowHours(settings.public_show_hours);
  }, [settings]);

  async function save() {
    if (startDate !== settings.start_date) {
      const ok = window.confirm(
        `Cambiando la data di inizio in ${longDate(startDate)} si spostano le date di tutte le 104 settimane. Le sessioni restano dove sono. Continuare?`,
      );
      if (!ok) return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.patch<{ settings: Settings }>('/api/private/settings', {
        start_date: startDate,
        weekly_target_hours: Number(target),
        public_show_hours: showHours,
      });
      onSaved(res.settings);
      setMessage({ ok: true, text: 'Impostazioni salvate.' });
    } catch (e) {
      setMessage({ ok: false, text: errorMessage(e) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <h2 className="text-base">Piano</h2>
      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="start" className="mb-1 block text-sm text-muted">
            Data di inizio (settimana 1)
          </label>
          <input id="start" type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <p className="mt-1 text-xs text-muted">Se resti indietro, sposta questa data: tutte le settimane si ricalcolano.</p>
        </div>
        <div>
          <label htmlFor="target" className="mb-1 block text-sm text-muted">
            Obiettivo di ore settimanali
          </label>
          <input id="target" type="number" inputMode="decimal" min={1} max={100} className={inputClass} value={target} onChange={(e) => setTarget(e.target.value)} />
        </div>
        <label className="flex min-h-12 items-center gap-3">
          <input type="checkbox" className="h-5 w-5 accent-[var(--accent)]" checked={showHours} onChange={(e) => setShowHours(e.target.checked)} />
          <span>Mostra le ore totali sul sito pubblico</span>
        </label>
        {message && (
          <p role="status" className={`text-sm ${message.ok ? 'text-accent-2' : 'text-danger'}`}>
            {message.text}
          </p>
        )}
        <button type="button" className="btn btn-primary w-full" onClick={() => void save()} disabled={saving}>
          {saving ? 'Salvataggio…' : 'Salva impostazioni'}
        </button>
      </div>
    </Card>
  );
}

function ExportCard() {
  return (
    <Card>
      <h2 className="text-base">Esporta</h2>
      <p className="mt-2 text-sm text-muted">Fai un backup ogni tanto: il file resta solo sul tuo dispositivo.</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <a href="/api/private/export.json" className="btn flex-1" download>
          Tutto in JSON
        </a>
        <a href="/api/private/sessions.csv" className="btn flex-1" download>
          Sessioni in CSV
        </a>
      </div>
    </Card>
  );
}

function ImportCard() {
  const [csv, setCsv] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setResult(null);
    setError(null);
    if (!file) return;
    if (file.size > 1_000_000) {
      setError('File troppo grande (max 1 MB).');
      return;
    }
    const text = await file.text();
    setCsv(text);
    setFileName(file.name);
    await run(text, true);
  }

  async function run(text: string, dryRun: boolean) {
    setBusy(true);
    setError(null);
    try {
      const res = await api.postCsv<ImportResult>(`/api/private/import/sessions${dryRun ? '?dryRun=true' : ''}`, text);
      setResult(res);
      if (!dryRun) setCsv(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <h2 className="text-base">Importa sessioni da CSV</h2>
      <p className="mt-2 text-sm text-muted">
        Dal vecchio foglio tracker: serve una riga di intestazione con almeno le colonne <code className="font-mono">data</code> e{' '}
        <code className="font-mono">minuti</code> (oppure <code className="font-mono">ore</code>). Facoltative:{' '}
        <code className="font-mono">categoria</code>, <code className="font-mono">nota</code>, <code className="font-mono">link</code>. Prima vedi
        l'anteprima, poi confermi.
      </p>
      <label htmlFor="csv" className="btn mt-4 w-full cursor-pointer">
        Scegli il file CSV
      </label>
      <input id="csv" type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => void onFile(e)} />
      {fileName && <p className="mt-2 font-mono text-xs text-muted">{fileName}</p>}
      {busy && <p className="mt-3 text-sm text-muted">Elaborazione…</p>}
      {error && <p className="mt-3 text-sm text-danger" role="alert">{error}</p>}

      {result && result.dryRun && (
        <div className="mt-4 space-y-3">
          <p className="text-sm">
            <strong>{result.valid}</strong> righe valide su {result.total} · {duration(result.totalMinutes)} in totale
          </p>
          {result.invalid.length > 0 && (
            <details className="text-sm text-danger">
              <summary className="cursor-pointer">{result.invalid.length} righe verranno saltate</summary>
              <ul className="mt-2 space-y-1 font-mono text-xs">
                {result.invalid.slice(0, 50).map((r) => (
                  <li key={r.line}>
                    riga {r.line}: {r.error}
                  </li>
                ))}
              </ul>
            </details>
          )}
          {result.preview.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Anteprima delle prime righe</caption>
                <thead className="text-xs text-muted">
                  <tr>
                    <th className="py-1 pr-3 font-normal">Data</th>
                    <th className="py-1 pr-3 font-normal">Durata</th>
                    <th className="py-1 pr-3 font-normal">Categoria</th>
                    <th className="py-1 font-normal">Nota</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-xs">
                  {result.preview.map((r, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="py-1 pr-3 whitespace-nowrap">{r.date}</td>
                      <td className="py-1 pr-3 whitespace-nowrap">{duration(r.minutes)}</td>
                      <td className="py-1 pr-3">{CATEGORY_LABELS[r.category as Category] ?? r.category}</td>
                      <td className="py-1">{r.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.valid > result.preview.length && (
                <p className="mt-1 text-xs text-muted">…e altre {result.valid - result.preview.length} righe.</p>
              )}
            </div>
          )}
          {csv && result.valid > 0 && (
            <button type="button" className="btn btn-primary w-full" onClick={() => void run(csv, false)} disabled={busy}>
              Importa {result.valid} sessioni
            </button>
          )}
        </div>
      )}
      {result && !result.dryRun && (
        <p className="mt-4 text-sm text-accent-2" role="status">
          Importate {result.imported} sessioni{result.invalid.length > 0 ? `, saltate ${result.invalid.length} righe` : ''}.
        </p>
      )}
    </Card>
  );
}
