import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, MessageSquare, Phone, ArrowUpRight, Filter } from 'lucide-react';

interface WhatsAppMessage {
  id: string;
  from_number: string;
  from_name: string | null;
  message_type: string;
  created_at: string;
}

interface FrequentSendersSidebarProps {
  messages: WhatsAppMessage[];
  selectedSender: string | null;
  onSelectSender: (number: string | null) => void;
}

export function FrequentSendersSidebar({
  messages,
  selectedSender,
  onSelectSender,
}: FrequentSendersSidebarProps) {
  // Aggregate sender statistics
  const senderMap = React.useMemo(() => {
    const map: Record<string, {
      number: string;
      name: string;
      count: number;
      lastMessageAt: string;
      types: Record<string, number>;
    }> = {};

    messages.forEach(msg => {
      const num = msg.from_number || 'غير معروف';
      if (!map[num]) {
        map[num] = {
          number: num,
          name: msg.from_name || num,
          count: 0,
          lastMessageAt: msg.created_at,
          types: {},
        };
      }
      map[num].count += 1;
      if (msg.from_name && (!map[num].name || map[num].name === map[num].number)) {
        map[num].name = msg.from_name;
      }
      if (new Date(msg.created_at) > new Date(map[num].lastMessageAt)) {
        map[num].lastMessageAt = msg.created_at;
      }
      map[num].types[msg.message_type] = (map[num].types[msg.message_type] || 0) + 1;
    });

    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [messages]);

  return (
    <Card className="p-5 space-y-4 shadow-sm border-slate-200">
      <div className="flex items-center justify-between pb-3 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">المُرسلون المتكررون</h3>
            <p className="text-xs text-muted-foreground">أبرز جهات الاتصال النشطة</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          {senderMap.length} مرسل
        </Badge>
      </div>

      {selectedSender && (
        <div className="flex items-center justify-between bg-emerald-50 text-emerald-800 p-2.5 rounded-lg text-xs">
          <span>فلتر النشط: <strong dir="ltr">{selectedSender}</strong></span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs text-emerald-700 hover:bg-emerald-100"
            onClick={() => onSelectSender(null)}
          >
            إلغاء الفلتر
          </Button>
        </div>
      )}

      <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
        {senderMap.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs">
            لا توجد بيانات مرسلين متاحة
          </div>
        ) : (
          senderMap.map(sender => {
            const isSelected = selectedSender === sender.number;
            return (
              <div
                key={sender.number}
                onClick={() => onSelectSender(isSelected ? null : sender.number)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50/80 border-emerald-300 shadow-sm'
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-xs text-slate-900 truncate">
                      {sender.name}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span dir="ltr">{sender.number}</span>
                    </div>
                  </div>
                  <Badge variant={isSelected ? 'default' : 'secondary'} className="text-[10px] h-5">
                    {sender.count} رسالة
                  </Badge>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-muted-foreground">
                  <span>آخر نشاط: {new Date(sender.lastMessageAt).toLocaleDateString('ar-SA')}</span>
                  <div className="flex gap-1">
                    {Object.entries(sender.types).map(([type, count]) => (
                      <span key={type} className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px]">
                        {type}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
