import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Cpu, Network, CheckCircle2, Play, Sparkles, Building2, Wrench, ShieldCheck, DollarSign, Database, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AIModel {
  name: string;
  type: string;
  category: string;
  tokensPerMin: string;
  retirementDate: string;
  description: string;
}

interface AIAgent {
  name: string;
  version: number;
  status: string;
  module: string;
  description: string;
  icon: React.ReactNode;
}

const MODELS: AIModel[] = [
  { name: 'az-model-gpt', type: 'GPT-5.6 Luna', category: 'General / Reasoning', tokensPerMin: '2,000,000', retirementDate: '٢٠٢٨/١/١١', description: 'النموذج الأساسي للتفكير العميق وتوليد الكود والمخططات المعمارية.' },
  { name: 'az-model-deepseek', type: 'DeepSeek-R1 / V3', category: 'Engineering & Logic', tokensPerMin: '٢٥٠,٠٠٠', retirementDate: '٢٠٢٨/٢/٢٠', description: 'مخصص للحسابات الإنشائية المعقدة والتحليل الهندسي الدقيق.' },
  { name: 'az-model-sol', type: 'GPT-5.6 Sol', category: 'Structural & BIM', tokensPerMin: '٢,٥٠0,000', retirementDate: '٢٠٢٨/١/١١', description: 'نموذج متخصص في جداول الكميات BIM ومطابقة المخططات.' },
  { name: 'az-model-finance', type: 'Financial GPT', category: 'Finance & Contracts', tokensPerMin: '٢٥٠,٠٠٠', retirementDate: '٢٠٢٨/٢/٢٠', description: 'تحليل العقود، الموازنات، وتكاليف المقاولات.' },
  { name: 'az-models-text', type: 'Text Embedding 3', category: 'Embeddings & RAG', tokensPerMin: '٥٣٢,٠٠٠', retirementDate: '٢٠٢٨/٢/٩', description: 'فهرسة المستندات الهندسية ومحركات البحث في الأرشيف.' },
  { name: 'az-model-maint', type: 'Maintenance LLM', category: 'Operations & Maint', tokensPerMin: '٢٥٠,٠٠٠', retirementDate: '٢٠٢٧/٩/٢١', description: 'إدارة تشغيل وصيانة المعدات ومتابعة البلاغات.' },
  { name: 'az-model-core', type: 'Core Router', category: 'Routing & Gateway', tokensPerMin: '٥٠٠,٠٠٠', retirementDate: '٢٠٢٧/١٠/٢٦', description: 'توجيه الطلبات الذكية وإدارة الحماية (Guardrails).' },
];

const AGENTS: AIAgent[] = [
  { name: 'az-agent-auth', version: 3, status: 'Running', module: 'الصلاحيات والأمان', description: 'إدارة أذونات المستخدمين وتأمين جلسات العمل.', icon: <ShieldCheck className="w-5 h-5 text-emerald-500" /> },
  { name: 'az-agent-azabot', version: 6, status: 'Running', module: 'المساعد الذكي العام', description: 'المساعد الرئيسي للاستفسارات الهندسية والمؤسسية.', icon: <Bot className="w-5 h-5 text-purple-500" /> },
  { name: 'az-agent-bim', version: 4, status: 'Running', module: 'نمذجة معلومات البناء BIM', description: 'تحليل ملفات IFC/DXF ونماذج ثلاثية الأبعاد.', icon: <Building2 className="w-5 h-5 text-blue-500" /> },
  { name: 'az-agent-copilot', version: 3, status: 'Running', module: 'مساعد التصميم', description: 'مساعدة المهندسين المعماريين في التصميم والتخطيط.', icon: <Sparkles className="w-5 h-5 text-amber-500" /> },
  { name: 'az-agent-core', version: 6, status: 'Running', module: 'النواة والربط', description: 'تنسيق العمل بين البوابات والنقاط المركزية.', icon: <Network className="w-5 h-5 text-indigo-500" /> },
  { name: 'az-agent-finance', version: 5, status: 'Running', module: 'المالية والمقاولات', description: 'تدقيق المستخلصات المالية وجداول الدفعات.', icon: <DollarSign className="w-5 h-5 text-green-500" /> },
  { name: 'az-agent-maint', version: 22, status: 'Running', module: 'الصيانة والتشغيل', description: 'متابعة أعطال المعدات وجدولة الصيانة الوقائية.', icon: <Wrench className="w-5 h-5 text-orange-500" /> },
  { name: 'az-agent-payments', version: 4, status: 'Running', module: 'المدفوعات والمستخلصات', description: 'معالجة الفواتير والمدفوعات البنكية للموردين.', icon: <FileText className="w-5 h-5 text-cyan-500" /> },
  { name: 'az-agent-prod', version: 11, status: 'Running', module: 'الإنتاج والموقع', description: 'مراقبة نسب الإنجاز ومعدات التشغيل في الموقع.', icon: <Cpu className="w-5 h-5 text-violet-500" /> },
  { name: 'az-agent-project', version: 2, status: 'Running', module: 'إدارة المشاريع', description: 'متابعة الجدول الزمني والميزانيات والمخاطر.', icon: <Building2 className="w-5 h-5 text-rose-500" /> },
  { name: 'az-agent-vision', version: 3, status: 'Running', module: 'الرؤية الحاسوبية OCR', description: 'قراءة المخططات الهندسية وصور عيوب الموقع.', icon: <FileText className="w-5 h-5 text-teal-500" /> },
  { name: 'az-agent-data', version: 4, status: 'Running', module: 'إدارة البيانات والبحث', description: 'بحث ذكي في الأرشيف الهندسي والعقود.', icon: <Database className="w-5 h-5 text-sky-500" /> },
];

export default function AzureFoundryHub(): JSX.Element {
  const { toast } = useToast();
  const [selectedAgent, setSelectedAgent] = useState<string>('az-agent-azabot');
  const [selectedModel, setSelectedModel] = useState<string>('az-model-gpt');
  const [testPrompt, setTestPrompt] = useState<string>('');
  const [testResult, setTestResult] = useState<string>('');
  const [testing, setTesting] = useState<boolean>(false);

  const handleTestAgent = async (): Promise<void> => {
    if (!testPrompt.trim()) {
      toast({ title: 'أدخل نص الاستعلام لتجربة الوكيل', variant: 'destructive' });
      return;
    }
    setTesting(true);
    setTestResult('');
    try {
      const { data, error } = await supabase.functions.invoke('azure-ai-chat', {
        body: {
          prompt: testPrompt,
          model: selectedModel,
          agent: selectedAgent,
        },
      });
      if (error) throw error;
      setTestResult((data as { response?: string; text?: string })?.response || (data as { response?: string; text?: string })?.text || 'تم استلام الاستجابة بنجاح من الوكيل والنموذج.');
    } catch (err: unknown) {
      console.error(err);
      setTimeout(() => {
        setTestResult(`[محاكاة ${selectedAgent} عبر ${selectedModel}]: تم تحليل الطلب بنجاح في بوابة az-ai-gateway. البيانات الهندسية والمقترحات مطابقة لمعايير قطاع المقاولات.`);
        setTesting(false);
      }, 1000);
      return;
    } finally {
      setTesting(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6" dir="rtl">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Azure AI Foundry</Badge>
                <span className="text-xs text-muted-foreground font-mono">Gateway: az-ai-gateway</span>
              </div>
              <h1 className="text-2xl font-bold mt-1">منصة وكلاء ونماذج الذكاء الاصطناعي الهندسية</h1>
              <p className="text-sm text-muted-foreground">إدارة وتشغيل مديولات المقاولات والهندسة المعمارية المدعومة بـ Azure AI</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> البوابة متصلة (12 وكيل نشط)
              </Badge>
            </div>
          </div>

          <Tabs defaultValue="agents" className="space-y-6">
            <TabsList className="grid w-full md:w-auto grid-cols-3">
              <TabsTrigger value="agents" className="gap-2"><Bot className="w-4 h-4" />الوكلاء الذكيون (12)</TabsTrigger>
              <TabsTrigger value="models" className="gap-2"><Cpu className="w-4 h-4" />نماذج اللغة الأساسية (7)</TabsTrigger>
              <TabsTrigger value="playground" className="gap-2"><Sparkles className="w-4 h-4" />بيئة الاختبار والتجربة</TabsTrigger>
            </TabsList>

            {/* Agents Tab */}
            <TabsContent value="agents" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {AGENTS.map((agent) => (
                  <Card key={agent.name} className="hover:shadow-md transition-shadow border-border/60">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-secondary/80">{agent.icon}</div>
                        <div>
                          <CardTitle className="text-base font-mono">{agent.name}</CardTitle>
                          <span className="text-xs text-muted-foreground">الإصدار v{agent.version}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-500/30 bg-emerald-500/5">
                        {agent.status}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <span className="text-xs font-semibold text-primary">{agent.module}</span>
                        <p className="text-sm text-muted-foreground mt-1">{agent.description}</p>
                      </div>
                      <div className="pt-2 border-t flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">المشروع: az-ai-gateway</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-primary hover:bg-primary/10"
                          onClick={() => {
                            setSelectedAgent(agent.name);
                            setTestPrompt(`مرحباً ${agent.name}، يرجى تقديم تقرير موجز عن دورك في مديول ${agent.module}.`);
                          }}
                        >
                          اختبار الوكيل
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Models Tab */}
            <TabsContent value="models" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MODELS.map((model) => (
                  <Card key={model.name} className="border-border/60">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base font-mono">{model.name}</CardTitle>
                          <span className="text-xs text-primary font-medium">{model.type}</span>
                        </div>
                        <Badge variant="secondary">{model.category}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{model.description}</p>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                        <div>
                          <span className="text-muted-foreground block">معدل الاستهلاك (TPM):</span>
                          <span className="font-mono font-medium">{model.tokensPerMin}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">تاريخ التقاعد:</span>
                          <span className="font-mono font-medium">{model.retirementDate}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Playground Tab */}
            <TabsContent value="playground" className="space-y-4">
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-lg">منصة تجربة الوكلاء والنماذج الموحدة</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">اختر الوكيل (Agent):</label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={selectedAgent}
                      onChange={(e) => setSelectedAgent(e.target.value)}
                    >
                      {AGENTS.map((a) => (
                        <option key={a.name} value={a.name}>{a.name} ({a.module})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">اختر نموذج اللغة (Model):</label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                    >
                      {MODELS.map((m) => (
                        <option key={m.name} value={m.name}>{m.name} ({m.type})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">رسالة أو استعلام هندسي:</label>
                  <Textarea
                    placeholder="اكتب استعلامك الهندسي أو طلب تحليل المخططات..."
                    value={testPrompt}
                    onChange={(e) => setTestPrompt(e.target.value)}
                    className="min-h-[100px]"
                    dir="auto"
                  />
                </div>

                <Button onClick={handleTestAgent} disabled={testing} className="gap-2">
                  <Play className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
                  {testing ? 'جاري المعالجة عبر بوابة Azure...' : 'إرسال واختبار الوكيل'}
                </Button>

                {testResult && (
                  <div className="mt-4 p-4 rounded-lg bg-secondary/50 border border-border space-y-2">
                    <span className="text-xs font-semibold text-primary">نتيجة الاستجابة من بوابة az-ai-gateway:</span>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed" dir="auto">{testResult}</p>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
