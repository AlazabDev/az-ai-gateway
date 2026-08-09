import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageSquare, FileText, Image, Video, Music, Search,
  RefreshCw, Download, Brain, Phone, Calendar, Filter, Send, BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sidebar } from '@/components/layout/Sidebar';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

interface WhatsAppMessage {
  id: string;
  wa_message_id: string;
  from_number: string;
  from_name: string;
  message_type: string;
  text_content: string | null;
  media_url: string | null;
  media_mime_type: string | null;
  media_filename: string | null;
  media_size: number | null;
  ai_analysis: string | null;
  ai_summary: string | null;
  extracted_data: any;
  status: string;
  created_at: string;
  processed_at: string | null;
}

// Renders a WhatsApp media attachment by resolving a short-lived signed URL
// when the stored value is a storage path (private bucket). Falls back to using
// the value directly if it's a full URL (legacy rows).
function MediaAttachment({ path, filename, mime }: { path: string; filename: string | null; mime: string | null }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function resolve() {
      if (/^https?:\/\//i.test(path)) {
        if (!cancelled) setUrl(path);
        return;
      }
      const { data, error } = await supabase.storage
        .from('whatsapp-media')
        .createSignedUrl(path, 3600);
      if (!cancelled) setUrl(error ? null : (data?.signedUrl ?? null));
    }
    resolve();
    return () => { cancelled = true; };
  }, [path]);

  return (
    <div>
      <h4 className="font-medium text-sm mb-1">الملف المرفق:</h4>
      <div className="flex items-center gap-2">
        <span className="text-sm truncate flex-1">{filename}</span>
        {url ? (
          <a href={url} target="_blank" rel="noreferrer">
            <Button size="sm" variant="outline" className="gap-1">
              <Download className="w-3 h-3" />
              تحميل
            </Button>
          </a>
        ) : (
          <Button size="sm" variant="outline" disabled>...</Button>
        )}
      </div>
      {mime?.startsWith('image') && url && (
        <img src={url} alt="Media" className="mt-2 rounded max-h-48 object-cover w-full" />
      )}
    </div>
  );
}

const typeIcons: Record<string, React.ReactNode> = {
  text: <MessageSquare className="w-4 h-4" />,
  image: <Image className="w-4 h-4" />,
  video: <Video className="w-4 h-4" />,
  audio: <Music className="w-4 h-4" />,
  document: <FileText className="w-4 h-4" />,
};

const typeLabels: Record<string, string> = {
  text: 'نص',
  image: 'صورة',
  video: 'فيديو',
  audio: 'صوت',
  document: 'مستند',
};

const statusColors: Record<string, string> = {
  received: 'bg-yellow-100 text-yellow-800',
  downloaded: 'bg-blue-100 text-blue-800',
  analyzed: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  received: 'مستلم',
  downloaded: 'تم التحميل',
  analyzed: 'تم التحليل',
  error: 'خطأ',
};

export default function WhatsApp() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState<WhatsAppMessage | null>(null);
  const [stats, setStats] = useState({ total: 0, texts: 0, media: 0, analyzed: 0 });
  const [quickReplyText, setQuickReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const presetReplies = [
    'أهلاً بك، تم استلام رسالتك وجاري مراجعتها من قبل الفريق الهندسي.',
    'شكراً لتواصلك معنا، سنقوم بالرد عليك خلال ساعات العمل الرسمية.',
    'تم استلام المستندات والمرفقات بنجاح وجاري تحليلها بالذكاء الاصطناعي.',
    'هل يمكنك تزويدنا بمزيد من التفاصيل والمخططات الهندسية المطلوبة؟',
  ];

  const handleSendQuickReply = async (textToSend?: string) => {
    const text = textToSend || quickReplyText;
    if (!text.trim() || !selectedMessage) return;

    setSendingReply(true);
    try {
      const { error } = await supabase.functions.invoke('whatsapp-send', {
        body: {
          to: selectedMessage.from_number,
          message: text,
          messageId: selectedMessage.id,
        },
      });

      if (error) throw error;

      toast({
        title: 'تم الإرسال بنجاح',
        description: `تم إرسال الرد السريع إلى ${selectedMessage.from_name || selectedMessage.from_number}`,
      });
      setQuickReplyText('');
      fetchMessages();
    } catch (error: any) {
      console.error('Quick reply error:', error);
      toast({
        title: 'خطأ في الإرسال',
        description: error?.message || 'فشل في إرسال الرد السريع عبر واتساب',
        variant: 'destructive',
      });
    } finally {
      setSendingReply(false);
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const msgs = (data || []) as WhatsAppMessage[];
      setMessages(msgs);

      setStats({
        total: msgs.length,
        texts: msgs.filter(m => m.message_type === 'text').length,
        media: msgs.filter(m => ['image', 'video', 'audio', 'document'].includes(m.message_type)).length,
        analyzed: msgs.filter(m => m.status === 'analyzed').length,
      });
    } catch (error) {
      console.error('Fetch error:', error);
      toast({ title: 'خطأ', description: 'فشل في جلب الرسائل', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Real-time subscription
    const channel = supabase
      .channel('whatsapp-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'whatsapp_messages',
      }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = messages.filter(msg => {
    const matchesType = filterType === 'all' || msg.message_type === filterType;
    const matchesSearch = !search ||
      msg.text_content?.includes(search) ||
      msg.from_name?.includes(search) ||
      msg.from_number?.includes(search) ||
      msg.ai_summary?.includes(search);
    return matchesType && matchesSearch;
  });

  const triggerAnalysis = async (messageId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-analyze', {
        body: { messageId },
      });
      if (error) throw error;
      toast({ title: 'تم بدء التحليل', description: 'جاري تحليل الرسالة بالذكاء الاصطناعي...' });
      setTimeout(fetchMessages, 3000);
    } catch (error) {
      toast({ title: 'خطأ', description: 'فشل في بدء التحليل', variant: 'destructive' });
    }
  };

  const chartData = React.useMemo(() => {
    const map: Record<string, { date: string; نص: number; صور: number; مستندات: number; أخرى: number }> = {};
    messages.forEach(msg => {
      const date = new Date(msg.created_at).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
      if (!map[date]) {
        map[date] = { date, نص: 0, صور: 0, مستندات: 0, أخرى: 0 };
      }
      if (msg.message_type === 'text') map[date].نص += 1;
      else if (msg.message_type === 'image') map[date].صور += 1;
      else if (msg.message_type === 'document') map[date].مستندات += 1;
      else map[date].أخرى += 1;
    });
    return Object.values(map);
  }, [messages]);

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">واتساب الأعمال</h1>
              <p className="text-muted-foreground">تحليل الرسائل والملفات بالذكاء الاصطناعي</p>
            </div>
            <Button onClick={fetchMessages} variant="outline" className="gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">إجمالي الرسائل</p>
            </Card>
            <Card className="p-4 text-center">
              <FileText className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{stats.texts}</p>
              <p className="text-sm text-muted-foreground">رسائل نصية</p>
            </Card>
            <Card className="p-4 text-center">
              <Image className="w-6 h-6 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{stats.media}</p>
              <p className="text-sm text-muted-foreground">ملفات وسائط</p>
            </Card>
            <Card className="p-4 text-center">
              <Brain className="w-6 h-6 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">{stats.analyzed}</p>
              <p className="text-sm text-muted-foreground">تم تحليلها</p>
            </Card>
          </div>

          {/* Search & Filter */}
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث في الرسائل..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pr-10"
                dir="rtl"
              />
            </div>
            <Tabs value={filterType} onValueChange={setFilterType}>
              <TabsList>
                <TabsTrigger value="all">الكل</TabsTrigger>
                <TabsTrigger value="text">نص</TabsTrigger>
                <TabsTrigger value="document">مستندات</TabsTrigger>
                <TabsTrigger value="image">صور</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Recharts Analytics Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                توزيع أنواع رسائل واتساب بمرور الوقت
              </h3>
              <Badge variant="outline" className="text-xs">إحصائيات تفاعلية</Badge>
            </div>
            <div className="h-[240px] w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="نص" fill="#030957" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="صور" fill="#FFB900" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="مستندات" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="أخرى" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Messages Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Messages List */}
            <div className="lg:col-span-2">
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {loading ? (
                    <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
                  ) : filtered.length === 0 ? (
                    <Card className="p-8 text-center">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                      <p className="text-muted-foreground">لا توجد رسائل بعد</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        ستظهر الرسائل هنا عند استلامها عبر واتساب الأعمال
                      </p>
                    </Card>
                  ) : (
                    filtered.map(msg => (
                      <Card
                        key={msg.id}
                        className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
                          selectedMessage?.id === msg.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedMessage(msg)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                              {typeIcons[msg.message_type] || <MessageSquare className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{msg.from_name || msg.from_number}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                <span dir="ltr">{msg.from_number}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {typeLabels[msg.message_type] || msg.message_type}
                            </Badge>
                            <Badge className={`text-xs ${statusColors[msg.status] || ''}`}>
                              {statusLabels[msg.status] || msg.status}
                            </Badge>
                          </div>
                        </div>

                        {msg.text_content && (
                          <p className="text-sm mt-2 text-muted-foreground line-clamp-2" dir="auto">
                            {msg.text_content}
                          </p>
                        )}

                        {msg.ai_summary && (
                          <div className="mt-2 p-2 rounded bg-purple-50 border border-purple-100">
                            <p className="text-xs text-purple-700 flex items-center gap-1">
                              <Brain className="w-3 h-3" />
                              {msg.ai_summary}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(msg.created_at).toLocaleString('ar-SA')}
                          </span>
                          {msg.status !== 'analyzed' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs gap-1"
                              onClick={(e) => { e.stopPropagation(); triggerAnalysis(msg.id); }}
                            >
                              <Brain className="w-3 h-3" />
                              تحليل
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Detail Panel */}
            <div>
              {selectedMessage ? (
                <Card className="p-5 space-y-4 sticky top-6">
                  <h3 className="font-bold text-lg">تفاصيل الرسالة</h3>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">المرسل:</span>
                      <span className="font-medium">{selectedMessage.from_name || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الرقم:</span>
                      <span dir="ltr">{selectedMessage.from_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">النوع:</span>
                      <Badge variant="secondary">
                        {typeLabels[selectedMessage.message_type] || selectedMessage.message_type}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الحالة:</span>
                      <Badge className={statusColors[selectedMessage.status] || ''}>
                        {statusLabels[selectedMessage.status] || selectedMessage.status}
                      </Badge>
                    </div>
                  </div>

                  {selectedMessage.text_content && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">المحتوى:</h4>
                      <p className="text-sm bg-muted p-3 rounded whitespace-pre-wrap" dir="auto">
                        {selectedMessage.text_content}
                      </p>
                    </div>
                  )}

                  {selectedMessage.media_url && (
                    <MediaAttachment
                      path={selectedMessage.media_url}
                      filename={selectedMessage.media_filename}
                      mime={selectedMessage.media_mime_type}
                    />
                  )}

                  {selectedMessage.ai_analysis && (
                    <div>
                      <h4 className="font-medium text-sm mb-1 flex items-center gap-1">
                        <Brain className="w-4 h-4 text-purple-500" />
                        تحليل الذكاء الاصطناعي:
                      </h4>
                      <div className="text-sm bg-purple-50 p-3 rounded whitespace-pre-wrap border border-purple-100" dir="auto">
                        {selectedMessage.ai_analysis}
                      </div>
                    </div>
                  )}

                  {selectedMessage.extracted_data && Object.keys(selectedMessage.extracted_data).length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-1">البيانات المستخرجة:</h4>
                      <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-40" dir="ltr">
                        {JSON.stringify(selectedMessage.extracted_data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {selectedMessage.status !== 'analyzed' && (
                    <Button
                      onClick={() => triggerAnalysis(selectedMessage.id)}
                      className="w-full gap-2"
                    >
                      <Brain className="w-4 h-4" />
                      تحليل بالذكاء الاصطناعي
                    </Button>
                  )}

                  {/* Quick Reply Section */}
                  <div className="border-t pt-4 space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      إرسال رد سريع عبر واتساب:
                    </h4>

                    <div className="flex flex-wrap gap-1.5">
                      {presetReplies.map((preset, idx) => (
                        <Button
                          key={idx}
                          size="sm"
                          variant="outline"
                          className="text-xs h-auto py-1.5 px-2.5 text-right whitespace-normal"
                          disabled={sendingReply}
                          onClick={() => handleSendQuickReply(preset)}
                        >
                          {preset}
                        </Button>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <Input
                        placeholder="اكتب ردّاً مخصصاً..."
                        value={quickReplyText}
                        onChange={(e) => setQuickReplyText(e.target.value)}
                        className="text-sm"
                        dir="auto"
                      />
                      <Button
                        size="sm"
                        className="w-full gap-2"
                        disabled={sendingReply || !quickReplyText.trim()}
                        onClick={() => handleSendQuickReply()}
                      >
                        <Send className={`w-4 h-4 ${sendingReply ? 'animate-spin' : ''}`} />
                        {sendingReply ? 'جاري الإرسال...' : 'إرسال الرد السريع'}
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-8 text-center">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-muted-foreground text-sm">اختر رسالة لعرض التفاصيل</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
