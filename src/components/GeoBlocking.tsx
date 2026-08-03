import React, { useState, useMemo } from 'react';
import {
  Globe,
  Search,
  Plus,
  Trash2,
  X,
  Check,
  AlertTriangle,
  MapPin,
  Loader2
} from 'lucide-react';
import { Card, PageHeader, FieldLabel, EmptyState } from './ui';

interface GeoBlockingProps {
  appId: string;
  geoSettings: GeoSettings;
  onUpdate: (settings: GeoSettings) => void;
}

interface GeoSettings {
  mode: 'blocklist' | 'allowlist';
  countries: string[];
}

const COUNTRY_LIST: { code: string; name: string }[] = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'RU', name: 'Russia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'IN', name: 'India' },
  { code: 'MX', name: 'Mexico' },
  { code: 'KR', name: 'South Korea' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'PL', name: 'Poland' },
  { code: 'NO', name: 'Norway' },
  { code: 'FI', name: 'Finland' },
  { code: 'DK', name: 'Denmark' },
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'PT', name: 'Portugal' },
  { code: 'IE', name: 'Ireland' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'SG', name: 'Singapore' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'KE', name: 'Kenya' },
  { code: 'EG', name: 'Egypt' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'TR', name: 'Turkey' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'PH', name: 'Philippines' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'TH', name: 'Thailand' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'PE', name: 'Peru' },
  { code: 'IL', name: 'Israel' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'LK', name: 'Sri Lanka' },
];

export const GeoBlocking: React.FC<GeoBlockingProps> = ({ appId, geoSettings, onUpdate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [testIp, setTestIp] = useState('');
  const [testResult, setTestResult] = useState<{ country: string; blocked: boolean } | null>(null);
  const [testing, setTesting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return COUNTRY_LIST;
    const q = searchQuery.toLowerCase();
    return COUNTRY_LIST.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const addedCountries = useMemo(() => {
    return geoSettings.countries
      .map((code) => COUNTRY_LIST.find((c) => c.code === code))
      .filter(Boolean) as { code: string; name: string }[];
  }, [geoSettings.countries]);

  const handleAddCountry = (code: string) => {
    if (geoSettings.countries.includes(code)) return;
    onUpdate({
      ...geoSettings,
      countries: [...geoSettings.countries, code],
    });
    setSuccessMsg('Country added!');
    setTimeout(() => setSuccessMsg(null), 2000);
  };

  const handleRemoveCountry = (code: string) => {
    onUpdate({
      ...geoSettings,
      countries: geoSettings.countries.filter((c) => c !== code),
    });
  };

  const handleBulkAdd = () => {
    const codes = bulkInput
      .split(/[,\s]+/)
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s.length === 2 && !geoSettings.countries.includes(s));
    if (codes.length > 0) {
      onUpdate({
        ...geoSettings,
        countries: [...geoSettings.countries, ...codes],
      });
      setBulkInput('');
      setSuccessMsg(`Added ${codes.length} country(s)!`);
      setTimeout(() => setSuccessMsg(null), 2000);
    }
  };

  const handleBulkRemove = () => {
    const codes = bulkInput
      .split(/[,\s]+/)
      .map((s) => s.trim().toUpperCase())
      .filter((s) => geoSettings.countries.includes(s));
    if (codes.length > 0) {
      onUpdate({
        ...geoSettings,
        countries: geoSettings.countries.filter((c) => !codes.includes(c)),
      });
      setBulkInput('');
      setSuccessMsg(`Removed ${codes.length} country(s)!`);
      setTimeout(() => setSuccessMsg(null), 2000);
    }
  };

  const handleToggleMode = () => {
    onUpdate({
      ...geoSettings,
      mode: geoSettings.mode === 'blocklist' ? 'allowlist' : 'blocklist',
    });
  };

  const handleTestIp = async () => {
    if (!testIp.trim()) return;
    setTesting(true);
    try {
      // Simulate API call - in production this would call a geo-lookup service
      await new Promise((resolve) => setTimeout(resolve, 800));
      // Mock result
      const mockCountry = COUNTRY_LIST[Math.floor(Math.random() * COUNTRY_LIST.length)];
      const isBlocked = geoSettings.countries.includes(mockCountry.code);
      setTestResult({
        country: mockCountry.name,
        blocked: geoSettings.mode === 'blocklist' ? isBlocked : !isBlocked,
      });
    } catch (err) {
      console.error('Geo lookup failed:', err);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Globe}
        accent="sky"
        title="Geo-Blocking"
        subtitle="Location-based access control for your application"
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-surface-600 dark:text-surface-400">Mode:</span>
            <button
              onClick={handleToggleMode}
              className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                geoSettings.mode === 'blocklist'
                  ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  : 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {geoSettings.mode === 'blocklist' ? 'Blocklist Mode' : 'Allowlist Mode'}
            </button>
          </div>
        }
      />

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <Check className="h-4 w-4 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Mode Explanation */}
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
            geoSettings.mode === 'blocklist'
              ? 'border-rose-500/20 bg-rose-500/10 text-rose-500'
              : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500'
          }`}>
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-surface-900 dark:text-white">
              {geoSettings.mode === 'blocklist' ? 'Blocklist Mode Active' : 'Allowlist Mode Active'}
            </p>
            <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">
              {geoSettings.mode === 'blocklist'
                ? `Access is denied from ${geoSettings.countries.length} blocked country(s). All other countries are allowed.`
                : `Access is only allowed from ${geoSettings.countries.length} country(s). All other countries are blocked.`}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Country Selector */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-sky-500" />
            <h3 className="text-sm font-bold text-surface-900 dark:text-white">
              {geoSettings.mode === 'blocklist' ? 'Blocked Countries' : 'Allowed Countries'}
            </h3>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search countries..."
              className="input py-2 pl-9 text-xs"
            />
          </div>

          {/* Country List */}
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filteredCountries.map((country) => {
              const isAdded = geoSettings.countries.includes(country.code);
              return (
                <div
                  key={country.code}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs transition-all ${
                    isAdded
                      ? 'border-sky-500/30 bg-sky-500/10'
                      : 'border-surface-100 bg-white hover:bg-surface-50 dark:border-white/5 dark:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-surface-700 dark:text-surface-300">
                      {country.code}
                    </span>
                    <span className="text-surface-700 dark:text-surface-300">{country.name}</span>
                  </div>
                  <button
                    onClick={() =>
                      isAdded ? handleRemoveCountry(country.code) : handleAddCountry(country.code)
                    }
                    className={`rounded-lg p-1 transition-colors ${
                      isAdded
                        ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
                        : 'bg-surface-100 text-surface-500 hover:bg-surface-200 dark:bg-white/[0.06]'
                    }`}
                  >
                    {isAdded ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  </button>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Current Selection & Bulk Operations */}
        <div className="space-y-5">
          {/* Selected Countries */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-sky-500" />
                <h3 className="text-sm font-bold text-surface-900 dark:text-white">
                  Selected ({geoSettings.countries.length})
                </h3>
              </div>
              {geoSettings.countries.length > 0 && (
                <button
                  onClick={() => onUpdate({ ...geoSettings, countries: [] })}
                  className="text-xs text-rose-500 hover:text-rose-600"
                >
                  Clear All
                </button>
              )}
            </div>

            {addedCountries.length === 0 ? (
              <p className="py-4 text-center text-xs text-surface-500 dark:text-surface-400">
                No countries selected
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {addedCountries.map((country) => (
                  <span
                    key={country.code}
                    className="inline-flex items-center gap-1 rounded-full border border-sky-500/25 bg-sky-500/10 px-2.5 py-1 text-[11px] font-bold text-sky-700 dark:text-sky-400"
                  >
                    <span className="font-mono">{country.code}</span>
                    <button
                      onClick={() => handleRemoveCountry(country.code)}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-sky-500/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Card>

          {/* Bulk Operations */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-sky-500" />
              <h3 className="text-sm font-bold text-surface-900 dark:text-white">Bulk Operations</h3>
            </div>

            <div>
              <FieldLabel>Country Codes (comma or space separated)</FieldLabel>
              <input
                type="text"
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder="e.g. US, GB, CA or US GB CA"
                className="input font-mono text-xs"
              />
            </div>

            <div className="flex gap-2">
              <button onClick={handleBulkAdd} className="btn-primary flex-1 text-xs">
                <Plus className="h-4 w-4" />
                <span>Add Countries</span>
              </button>
              <button onClick={handleBulkRemove} className="btn-ghost flex-1 text-xs">
                <Trash2 className="h-4 w-4" />
                <span>Remove Countries</span>
              </button>
            </div>
          </Card>

          {/* Geo-Lookup Test */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-sky-500" />
              <h3 className="text-sm font-bold text-surface-900 dark:text-white">Geo-Lookup Test</h3>
            </div>

            <div>
              <FieldLabel>IP Address</FieldLabel>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testIp}
                  onChange={(e) => setTestIp(e.target.value)}
                  placeholder="e.g. 8.8.8.8"
                  className="input flex-1 font-mono text-xs"
                />
                <button
                  onClick={handleTestIp}
                  disabled={!testIp.trim() || testing}
                  className="btn-primary text-xs"
                >
                  {testing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Globe className="h-4 w-4" />
                  )}
                  <span>Test</span>
                </button>
              </div>
            </div>

            {testResult && (
              <div
                className={`rounded-xl border p-4 ${
                  testResult.blocked
                    ? 'border-rose-500/25 bg-rose-500/10'
                    : 'border-emerald-500/25 bg-emerald-500/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  {testResult.blocked ? (
                    <AlertTriangle className="h-5 w-5 text-rose-500" />
                  ) : (
                    <Check className="h-5 w-5 text-emerald-500" />
                  )}
                  <div>
                    <p className="text-sm font-bold text-surface-900 dark:text-white">
                      {testResult.country}
                    </p>
                    <p
                      className={`text-xs font-semibold ${
                        testResult.blocked
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {testResult.blocked ? 'ACCESS BLOCKED' : 'ACCESS ALLOWED'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
