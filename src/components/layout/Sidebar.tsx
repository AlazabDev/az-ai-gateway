import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  MessageSquare,
  Settings,
  BarChart3,
  Phone,
  Cloud,
  Eye,
  FileSearch,
  Wand2,
  Search as SearchIcon,
  Bot,
  Hammer,
  Box,
  LogOut,
  LogIn,
  Plus,
  Pencil,
  Check,
  X,
  Menu,
  Sparkles,
  Building2,
  Wallet,
  FileText,
  CheckSquare,
  BarChart3 as BarChartIcon,
  AudioLines,
  Calculator,
  FileSpreadsheet,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useChatSession } from '@/lib/chat-session-store';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChatSession {
  id: string;
  title: string;
  updated_at: string;
}

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', icon: MessageSquare, label: 'الدردشة الذكية' },
  { to: '/tools/tasks', icon: CheckSquare, label: 'المهام والمشاريع' },
  { to: '/tools/contracts', icon: FileText, label: 'العقود والمستندات' },
  { to: '/tools/reports', icon: BarChartIcon, label: 'التقارير الذكية' },
  { to: '/finance/module', icon: Calculator, label: 'موديول المالية' },
  { to: '/finance', icon: Wallet, label: 'التحليل المالي' },
  { to: '/architecture', icon: Building2, label: 'تحليل معماري' },
  { to: '/productivity', icon: Sparkles, label: 'أدوات الكتابة' },
  { to: '/tools/speech', icon: AudioLines, label: 'استوديو الصوت', badge: 'جديد' },
  { to: '/engineering', icon: Box, label: 'الأدوات الهندسية' },
  { to: '/whatsapp', icon: Phone, label: 'واتساب الأعمال' },
  { to: '/google-sheets', icon: FileSpreadsheet, label: 'Google Sheets', badge: 'متصل' },
  { to: '/azure', icon: Cloud, label: 'أدوات Azure' },
  { to: '/azure/foundry', icon: Bot, label: 'منصة Azure Foundry والوكلاء', badge: 'أساسي' },
  { to: '/azure/settings', icon: Bot, label: 'نماذج ووكلاء Azure' },
  { to: '/analytics', icon: BarChart3, label: 'التحليلات' },
];

const SERVICE_ITEMS: NavItem[] = [
  { to: '/azure/vision', icon: Eye, label: 'Vision · GPT-5.5' },
  { to: '/azure/finance', icon: Wallet, label: 'Finance · GPT-5.1' },
  { to: '/azure/agents/maintenance', icon: Hammer, label: 'Maintenance Agent' },
  { to: '/azure/agents/production', icon: Bot, label: 'Production Agent' },
  { to: '/azure/speech', icon: Phone, label: 'Speech Voice Live' },
  { to: '/services/vision', icon: Eye, label: 'Vision / OCR' },
  { to: '/services/docint', icon: FileSearch, label: 'Document Intelligence' },
  { to: '/services/ai-processing', icon: Wand2, label: 'AI Processing' },
  { to: '/services/search', icon: SearchIcon, label: 'بحث الصيانة' },
  { to: '/services/agent', icon: Bot, label: 'مساعد RAG' },
  { to: '/services/arch-erp', icon: Hammer, label: 'Arch ERP' },
];

const SETTINGS_ITEMS: NavItem[] = [
  { to: '/settings', icon: Settings, label: 'الإعدادات' },
];

export const Sidebar = (): JSX.Element => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { sessionId, setSession } = useChatSession();

  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [sessionSearch, setSessionSearch] = useState('');

  const loadSessions = async () => {
    if (!user) {
      // Load local sessions
      try {
        const local = localStorage.getItem('alazab_chat_sessions');
        if (local) {
          setSessions(JSON.parse(local));
        } else {
          setSessions([]);
        }
      } catch {
        setSessions([]);
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('id, title, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) {
        // Fallback to local storage
        const local = localStorage.getItem('alazab_chat_sessions');
        if (local) {
          setSessions(JSON.parse(local));
        } else {
          setSessions([]);
        }
        return;
      }
      setSessions((data ?? []) as ChatSession[]);
    } catch {
      try {
        const local = localStorage.getItem('alazab_chat_sessions');
        if (local) {
          setSessions(JSON.parse(local));
        } else {
          setSessions([]);
        }
      } catch {
        setSessions([]);
      }
    }
  };

  useEffect(() => {
    loadSessions();
    const interval = window.setInterval(loadSessions, 30000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const createNewChat = (): void => {
    setSession(null);
    navigate('/');
    setIsOpen(false);
  };

  const handleRename = async (id: string) => {
    if (!editTitle.trim()) return;
    await supabase.from('chat_sessions').update({ title: editTitle.trim() }).eq('id', id);
    setEditingId(null);
    loadSessions();
  };

  const handleLogout = async () => {
    await signOut();
    toast({ title: 'تم تسجيل الخروج' });
    navigate('/auth');
  };

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(sessionSearch.trim().toLowerCase()),
  );

  const NavLink = ({ to, icon: Icon, label }: NavItem) => {
    const active = pathname === to;
    return (
      <Link
        to={to}
        onClick={() => setIsOpen(false)}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
          active ? 'bg-primary/15 text-primary font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">{label}</span>
      </Link>
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-40 lg:hidden p-2.5 bg-slate-900 text-white dark:bg-slate-800 rounded-xl shadow-md transition-colors"
        aria-label="فتح القائمة"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <aside className={`
        fixed lg:static top-0 right-0 h-screen w-72 bg-slate-900 text-slate-100 border-l border-slate-800
        transition-all duration-300 z-30 shadow-xl lg:shadow-none
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        <div className="p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold tracking-tight text-white">Alazab AI Console</h1>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">نشط</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">منصة الذكاء الهندسي والإداري المتكاملة</p>
        </div>

        <nav className="flex-1 overflow-y-auto flex flex-col p-3 space-y-2">
          <button
            type="button"
            onClick={createNewChat}
            className="w-full px-4 py-3 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm flex items-center gap-2 justify-center mb-2"
          >
            <Plus className="w-4 h-4" />
            <span>جلسة دردشة جديدة</span>
          </button>

          <div className="space-y-1">
            {NAV_ITEMS.map(({ to, icon: Icon, label, badge }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all text-sm ${
                  pathname === to
                    ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 truncate">{label}</span>
                {badge && <Badge variant="outline" className="text-[10px] h-4 px-1 bg-slate-800 border-slate-700 text-slate-300">{badge}</Badge>}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800">
            <div className="px-2 pb-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">المحادثات السابقة</span>
            </div>
            <div className="px-2 pb-2">
              <div className="relative">
                <SearchIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <Input
                  value={sessionSearch}
                  onChange={event => setSessionSearch(event.target.value)}
                  placeholder="ابحث في المحادثات..."
                  className="h-8 text-xs pr-8 bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-500"
                />
              </div>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {filteredSessions.length === 0 && (
                <p className="text-[11px] text-slate-500 text-center py-2">
                  {sessionSearch ? 'لا توجد نتائج' : 'لا توجد محادثات مسجلة'}
                </p>
              )}
              {filteredSessions.map(session => (
                <div
                  key={session.id}
                  className={`group flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                    sessionId === session.id ? 'bg-primary/20 text-primary-foreground font-semibold' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  onClick={() => editingId !== session.id && setSession(session.id)}
                >
                  <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                  {editingId === session.id ? (
                    <>
                      <Input
                        value={editTitle}
                        onChange={event => setEditTitle(event.target.value)}
                        className="h-6 text-xs flex-1 bg-slate-950 border-slate-700 text-white"
                        onClick={event => event.stopPropagation()}
                        onKeyDown={event => event.key === 'Enter' && handleRename(session.id)}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-emerald-400 hover:bg-slate-800"
                        onClick={event => { event.stopPropagation(); handleRename(session.id); }}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-rose-400 hover:bg-slate-800"
                        onClick={event => { event.stopPropagation(); setEditingId(null); }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 truncate" dir="auto">{session.title}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white"
                        onClick={event => { event.stopPropagation(); setEditingId(session.id); setEditTitle(session.title); }}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <Accordion type="multiple" defaultValue={['services']} className="border-t border-slate-800 pt-2">
              <AccordionItem value="services" className="border-0">
                <AccordionTrigger className="py-2 px-2 text-[11px] uppercase tracking-wider text-slate-400 font-bold hover:no-underline">
                  خدمات Azure المتقدمة
                </AccordionTrigger>
                <AccordionContent className="pb-2">
                  <div className="space-y-1">
                    {SERVICE_ITEMS.map(item => <NavLink key={item.to} {...item} />)}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </nav>

        <div className="border-t border-slate-800 p-4 bg-slate-950/60 space-y-3">
          {SETTINGS_ITEMS.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium transition-all text-sm ${
                pathname === to
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </Link>
          ))}

          {user ? (
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="px-3 py-1.5 bg-slate-950 rounded-lg border border-slate-800">
                <p className="text-[11px] text-slate-400">المستخدم الحالي</p>
                <p className="text-xs font-semibold text-slate-200 truncate">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10 transition-all font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل خروج</span>
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all text-sm justify-center shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول</span>
            </Link>
          )}
        </div>
      </aside>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-20 lg:hidden" onClick={() => setIsOpen(false)} />
      )}
    </>
  );
};

