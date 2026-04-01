import { useState, useMemo } from 'react';
import { Search, CheckCircle2, Plus, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Integration {
  id: string;
  name: string;
  desc: string;
  icon: string;
  category: 'marketing' | 'analytics' | 'crm' | 'data';
  docsUrl?: string;
}

const INTEGRATIONS: Integration[] = [
  // Marketing Tools
  { id: 'google-ads',      name: 'Google Ads',           desc: 'Manage and optimize paid search campaigns',    icon: '🎯', category: 'marketing' },
  { id: 'meta-ads',        name: 'Meta Ads',             desc: 'Facebook and Instagram advertising',           icon: '📘', category: 'marketing' },
  { id: 'linkedin-ads',    name: 'LinkedIn Ads',         desc: 'B2B advertising on LinkedIn',                  icon: '💼', category: 'marketing' },
  { id: 'twitter-ads',     name: 'X / Twitter Ads',      desc: 'Reach audiences on X (formerly Twitter)',      icon: '🐦', category: 'marketing' },
  { id: 'tiktok-ads',      name: 'TikTok Ads',           desc: 'Short-form video advertising on TikTok',       icon: '🎵', category: 'marketing' },
  { id: 'hubspot',         name: 'HubSpot',              desc: 'CRM, email marketing and automation',          icon: '🔶', category: 'marketing' },
  { id: 'salesforce',      name: 'Salesforce',           desc: 'Enterprise CRM and sales platform',            icon: '☁️', category: 'marketing' },
  { id: 'mailchimp',       name: 'Mailchimp',            desc: 'Email marketing and audience management',      icon: '🐵', category: 'marketing' },
  { id: 'klaviyo',         name: 'Klaviyo',              desc: 'Email and SMS marketing platform',             icon: '📧', category: 'marketing' },
  { id: 'wordpress',       name: 'WordPress',            desc: 'Publish content to your WordPress site',       icon: '📝', category: 'marketing' },
  { id: 'webflow',         name: 'Webflow',              desc: 'No-code web design and publishing',            icon: '🌊', category: 'marketing' },
  { id: 'zapier',          name: 'Zapier',               desc: 'Automate workflows across 5,000+ apps',        icon: '⚡', category: 'marketing' },
  { id: 'notion',          name: 'Notion',               desc: 'Sync content, notes and knowledge base',       icon: '📓', category: 'marketing' },
  { id: 'slack',           name: 'Slack',                desc: 'Receive alerts and reports in Slack channels', icon: '💬', category: 'marketing' },
  { id: 'airtable',        name: 'Airtable',             desc: 'Database and project management',              icon: '🗃️', category: 'marketing' },
  { id: 'instagram',       name: 'Instagram',            desc: 'Publish and analyze Instagram content',        icon: '📸', category: 'marketing' },
  { id: 'linkedin',        name: 'LinkedIn',             desc: 'Share content and track engagement',           icon: '🔗', category: 'marketing' },
  { id: 'youtube',         name: 'YouTube',              desc: 'Manage and analyze YouTube content',           icon: '▶️', category: 'marketing' },
  // Analytics & Data
  { id: 'ga4',             name: 'Google Analytics 4',   desc: 'Website traffic and user behavior analytics',  icon: '📊', category: 'analytics' },
  { id: 'search-console',  name: 'Google Search Console',desc: 'Search performance and SEO insights',          icon: '🔍', category: 'analytics' },
  { id: 'meta-pixel',      name: 'Meta Pixel',           desc: 'Facebook conversion tracking and retargeting', icon: '📍', category: 'analytics' },
  { id: 'mixpanel',        name: 'Mixpanel',             desc: 'Product analytics and user journey analysis',  icon: '📈', category: 'analytics' },
  { id: 'segment',         name: 'Segment',              desc: 'Customer data platform and event routing',     icon: '🔀', category: 'analytics' },
];

const STORAGE_KEY = 'marqq_integrations';

function loadConnected(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch { return new Set(); }
}

function saveConnected(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

const CATEGORY_LABELS: Record<string, string> = {
  marketing: 'Marketing Tools',
  analytics: 'Analytics & Data',
};

export function IntegrationsHub() {
  const [search, setSearch] = useState('');
  const [connected, setConnected] = useState<Set<string>>(loadConnected);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return INTEGRATIONS;
    return INTEGRATIONS.filter(
      (i) => i.name.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q),
    );
  }, [search]);

  const grouped = useMemo(() => {
    const map: Record<string, Integration[]> = {};
    for (const item of filtered) {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    }
    return map;
  }, [filtered]);

  const handleToggle = (id: string, name: string) => {
    setConnected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast.info(`${name} disconnected`);
      } else {
        next.add(id);
        toast.success(`${name} connected successfully`);
      }
      saveConnected(next);
      return next;
    });
  };

  const connectedCount = connected.size;

  return (
    <div className="min-h-full bg-background">
      {/* Page header */}
      <div className="border-b border-border/60 bg-background/95 backdrop-blur px-8 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Connect your marketing stack to unlock autonomous intelligence
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {connectedCount > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-3 py-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-semibold text-green-700 dark:text-green-300">
                    {connectedCount} connected
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-5 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search integrations..."
              className="pl-9 border-gray-200 dark:border-gray-700 focus:border-[#6B4FEB] focus:ring-[#6B4FEB]"
            />
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-5xl mx-auto px-8 py-8 space-y-10">
        {(Object.entries(grouped) as [string, Integration[]][]).map(([category, items]) => (
          <section key={category}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-4">
              {CATEGORY_LABELS[category] ?? category}{' '}
              <span className="text-muted-foreground/60">({items.length})</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((item) => {
                const isConnected = connected.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'group relative flex items-start gap-3 rounded-xl border bg-white dark:bg-gray-900 p-4 transition-all duration-200',
                      isConnected
                        ? 'border-[#6B4FEB]/30 shadow-sm shadow-[#6B4FEB]/10'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md hover:shadow-black/5',
                    )}
                  >
                    {/* Logo */}
                    <div className="h-10 w-10 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-2xl flex-shrink-0">
                      {item.icon}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                        {isConnected && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            <span className="text-[10px] font-medium text-green-600 dark:text-green-400">Connected</span>
                          </div>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {item.desc}
                      </p>

                      {/* Action */}
                      <div className="mt-3">
                        {isConnected ? (
                          <button
                            onClick={() => handleToggle(item.id, item.name)}
                            className="text-xs text-muted-foreground hover:text-red-500 transition-colors font-medium"
                          >
                            Disconnect
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggle(item.id, item.name)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#6B4FEB] hover:text-[#5a3fd4] border border-[#6B4FEB]/30 hover:border-[#6B4FEB] rounded-md px-2.5 py-1 transition-all duration-150 hover:bg-[#6B4FEB]/5"
                          >
                            <Plus className="h-3 w-3" />
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Request integration card */}
              {category === 'analytics' && (
                <div className="flex items-start gap-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-transparent p-4 hover:border-[#6B4FEB]/40 hover:bg-[#6B4FEB]/3 transition-all duration-200 cursor-pointer group">
                  <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <Plus className="h-5 w-5 text-gray-400 group-hover:text-[#6B4FEB] transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground/70 group-hover:text-foreground transition-colors">
                      Request Integration
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Don't see your tool? Vote for it on our public roadmap.
                    </p>
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-[#6B4FEB] transition-colors">
                        Submit request <ExternalLink className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        ))}

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">🔌</div>
            <p className="text-sm font-medium text-foreground">No integrations found</p>
            <p className="text-sm text-muted-foreground mt-1">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  );
}
