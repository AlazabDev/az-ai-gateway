import { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, Trash2, Smartphone, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'success' | 'warning' | 'info' | 'agent';
  read: boolean;
}

export const NotificationCenter = (): JSX.Element => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'تنبيه وكيل Azure Foundry',
      message: 'الوكيل az-agent-maint أكمل فحص الصيانة الدورية بنجاح.',
      time: 'منذ 5 دقائق',
      type: 'agent',
      read: false,
    },
    {
      id: '2',
      title: 'رسالة واتساب جديدة',
      message: 'تم استلام استفسار هندسي جديد عبر مديول واتساب الأعمال.',
      time: 'منذ 25 دقيقة',
      type: 'info',
      read: false,
    },
    {
      id: '3',
      title: 'تحديث مالي ومقاولات',
      message: 'تمت مطابقة مستخلص المشروع رقم #402 عبر نموذج GPT-5.6 Sol.',
      time: 'منذ ساعة',
      type: 'success',
      read: true,
    },
    {
      id: '4',
      title: 'تنبيه حماية البوابة (Guardrails)',
      message: 'تم رصد محاولة اتصال بـ az-model-deepseek وتم تطبيق سياسة الحماية.',
      time: 'منذ ساعتين',
      type: 'warning',
      read: true,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
    toast({ title: 'تم تعيين جميع الإشعارات كمقروءة' });
  };

  const clearAll = () => {
    setNotifications([]);
    toast({ title: 'تم مسح جميع الإشعارات' });
  };

  const installPWA = () => {
    // Prompt or info about mobile app installation
    toast({
      title: 'تثبيت التطبيق على الهاتف (PWA)',
      description: 'يمكنك إضافة التطبيق إلى الشاشة الرئيسية لهاتفك عبر الضغط على خيار "إضافة إلى الشاشة الرئيسية" من متصفح الهاتف.',
    });
  };

  return (
    <div className="flex items-center gap-2">
      {/* Mobile Install button */}
      <Button
        variant="outline"
        size="sm"
        onClick={installPWA}
        className="hidden md:flex items-center gap-1.5 text-xs border-[#FFB900]/40 text-[#030957] dark:text-amber-400 hover:bg-[#FFB900]/10"
      >
        <Smartphone className="w-3.5 h-3.5 text-[#FFB900]" />
        تثبيت تطبيق الهاتف
      </Button>

      {/* Notifications Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-primary/10">
            <Bell className="w-5 h-5 text-[#030957] dark:text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#FFB900] text-[#030957] font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0 shadow-lg border border-border/60" align="end" dir="rtl">
          <div className="p-3 border-b flex items-center justify-between bg-secondary/30">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#030957]" />
              <span className="font-bold text-sm">مركز الإشعارات الهندسية</span>
            </div>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-7 px-2">
                قراءة الكل
              </Button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-border/40">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                لا توجد إشعارات حالياً
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 text-right hover:bg-muted/50 transition-colors ${
                    !item.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[#030957] dark:text-primary-foreground flex items-center gap-1.5">
                      {item.type === 'success' && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                      {item.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                      {item.type === 'agent' && <Sparkles className="w-3.5 h-3.5 text-purple-500" />}
                      {item.type === 'info' && <Info className="w-3.5 h-3.5 text-blue-500" />}
                      {item.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{item.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.message}</p>
                </div>
              ))
            )}
          </div>

          <div className="p-2 border-t flex justify-between items-center bg-secondary/20">
            <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs text-destructive h-7 gap-1">
              <Trash2 className="w-3 h-3" /> مسح الكل
            </Button>
            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
              متصل بالذكاء الاصطناعي
            </Badge>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
