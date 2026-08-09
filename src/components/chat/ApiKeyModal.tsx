import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Bot, CheckCircle, ShieldCheck } from 'lucide-react';
import {
  aiConfigManager,
  availableAzureModels,
  type AIConfig,
  type AzureApimModel,
} from '@/lib/ai-providers';
import { useToast } from '@/hooks/use-toast';

interface ApiKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigSaved: () => void;
}

export const ApiKeyModal = ({ open, onOpenChange, onConfigSaved }: ApiKeyModalProps) => {
  const { toast } = useToast();
  const [model, setModel] = useState<AzureApimModel>('gpt-5.5');

  useEffect(() => {
    setModel(aiConfigManager.load().model);
  }, [open]);

  const handleSave = () => {
    const config: AIConfig = { provider: 'azure-apim', model };
    aiConfigManager.save(config);
    onConfigSaved();
    onOpenChange(false);
    toast({
      title: 'تم حفظ إعداد العرض',
      description: 'المفاتيح والأسرار تظل داخل Supabase Edge Functions ولا تُحفظ في المتصفح.',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            إعداد بوابة الذكاء الاصطناعي
          </DialogTitle>
        </DialogHeader>

        <Card className="p-4 bg-muted/50">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">اتصال مركزي آمن</p>
              <p className="text-muted-foreground mt-1">
                يتم تنفيذ جميع الطلبات عبر بوابة Azure AI الخادمية. لا تقبل هذه الواجهة أي API Key أو Token.
              </p>
            </div>
          </div>
        </Card>

        <div className="space-y-2">
          <label htmlFor="azure-model" className="text-sm font-medium">
            النموذج الافتراضي
          </label>
          <select
            id="azure-model"
            value={model}
            onChange={(event) => setModel(event.target.value as AzureApimModel)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            dir="ltr"
          >
            {availableAzureModels.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            يجب أن يكون النموذج ضمن قائمة النماذج المسموحة في Edge Function وإعدادات Azure.
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} className="flex-1">
            <CheckCircle className="w-4 h-4 ml-2" />
            حفظ
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
