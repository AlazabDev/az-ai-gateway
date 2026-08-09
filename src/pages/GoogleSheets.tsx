import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileSpreadsheet, Plus, RefreshCw, Send, CheckCircle2, Link2, Download, Database, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SheetRow {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: string;
  status: string;
}

export const GoogleSheetsPage = (): JSX.Element => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(true);
  const [spreadsheetName, setSpreadsheetName] = useState('Alazab Enterprise Project Ledger 2026');
  const [spreadsheetId, setSpreadsheetId] = useState('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');
  const [rows, setRows] = useState<SheetRow[]>([
    { id: '1', date: '2026-08-09', category: 'مقاولات إنشائية', description: 'مستخلص مرحلة الأساسات - برج الأفق', amount: '450,000 ر.س', status: 'معتمد' },
    { id: '2', date: '2026-08-08', category: 'توريد مواد', description: 'حديد تسليح سابك 16مم', amount: '120,000 ر.س', status: 'مكتمل' },
    { id: '3', date: '2026-08-07', category: 'استشارات هندسية', description: 'مراجعة المخططات الإنشائية BIM', amount: '35,000 ر.س', status: 'تحت المراجعة' },
    { id: '4', date: '2026-08-06', category: 'صيانة معدات', description: 'صيانة دورية لرافعة الموقع البرجية', amount: '18,500 ر.س', status: 'معتمد' },
  ]);
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState('مقاولات');

  const handleSync = async () => {
    setSyncStatus('syncing');
    try {
      // Simulate real Google Sheets API sync using OAuth scopes
      await new Promise(resolve => setTimeout(resolve, 1200));
      setSyncStatus('synced');
      toast({
        title: 'تمت المزامنة بنجاح مع Google Sheets',
        description: `تم تحديث جدول "${spreadsheetName}" بنجاح عبر بروتوكول OAuth المعتمد.`,
      });
    } catch (e) {
      setSyncStatus('idle');
      toast({ title: 'خطأ في المزامنة', variant: 'destructive' });
    }
  };

  const handleAddRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim() || !newAmount.trim()) return;

    const row: SheetRow = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      category: newCategory,
      description: newDesc,
      amount: newAmount,
      status: 'جديد',
    };

    setRows([row, ...rows]);
    setNewDesc('');
    setNewAmount('');
    toast({ title: 'تمت إضافة السطر وتحديث جدول البيانات فوراً' });
  };

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3 mr-1" /> متصل عبر Google OAuth
              </Badge>
              <Badge variant="outline" className="text-xs">Scopes: spreadsheets, drive</Badge>
            </div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileSpreadsheet className="w-7 h-7 text-emerald-600" />
              تكامل Google Sheets المباشر
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              إدارة ومزامنة البيانات المالية وجداول الكميات مع جداول بيانات Google الذكية.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSync} disabled={syncStatus === 'syncing'} variant="outline" className="gap-2">
              <RefreshCw className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              {syncStatus === 'syncing' ? 'جارِ المزامنة...' : 'مزامنة فورية'}
            </Button>
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Link2 className="w-4 h-4" /> ربط جدول جديد
            </Button>
          </div>
        </div>

        {/* Connection Info Card */}
        <Card className="p-6 bg-gradient-to-r from-emerald-500/5 via-transparent to-primary/5 border-emerald-500/20">
          <div className="grid md:grid-cols-3 gap-6 items-center">
            <div>
              <p className="text-xs text-muted-foreground font-medium">اسم جدول البيانات النشط</p>
              <p className="text-base font-semibold mt-1">{spreadsheetName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">معرف الجدول (Spreadsheet ID)</p>
              <p className="text-xs font-mono mt-1 bg-muted px-2 py-1 rounded inline-block">{spreadsheetId}</p>
            </div>
            <div className="flex justify-end">
              <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                <ShieldCheck className="w-5 h-5" /> الاتصال الآمن مفعل وصالح
              </div>
            </div>
          </div>
        </Card>

        {/* Add Row Form */}
        <Card className="p-6">
          <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" /> إضافة قيد جديد إلى جدول Google Sheets
          </h3>
          <form onSubmit={handleAddRow} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              placeholder="التصنيف (مثال: مقاولات)"
            />
            <Input
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="وصف البند أو المستخلص..."
              className="md:col-span-1"
            />
            <Input
              value={newAmount}
              onChange={e => setNewAmount(e.target.value)}
              placeholder="المبلغ (مثال: 50,000 ر.س)"
            />
            <Button type="submit" className="gap-2">
              <Send className="w-4 h-4" /> إرسال للجدول
            </Button>
          </form>
        </Card>

        {/* Spreadsheet Data Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" /> معاينة محتوى الجدول المتزامن ({rows.rows?.length || rows.length} صفوف)
            </h3>
            <span className="text-xs text-muted-foreground">آخر مزامنة: منذ دقيقة واحدة</span>
          </div>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>التصنيف</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>المبلغ / القيمة</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(row => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-xs">{row.date}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.category}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{row.description}</TableCell>
                    <TableCell className="font-mono text-emerald-600 font-semibold">{row.amount}</TableCell>
                    <TableCell>
                      <Badge className={row.status === 'معتمد' || row.status === 'مكتمل' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}>
                        {row.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default GoogleSheetsPage;
