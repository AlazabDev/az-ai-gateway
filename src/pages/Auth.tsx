import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Bot, Loader2, LockKeyhole } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/', { replace: true });
    });
  }, [navigate]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast({
        title: 'فشل تسجيل الدخول',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-gradient-to-r from-ai-primary to-ai-accent flex items-center justify-center">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">Alazab AI Console</h1>
            <p className="text-sm text-muted-foreground">منصة داخلية لمستخدمي العزب المصرح لهم فقط</p>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground flex gap-2">
          <LockKeyhole className="w-4 h-4 mt-0.5 shrink-0" />
          <p>إنشاء الحسابات متوقف من الواجهة. تتم إضافة المستخدمين وإدارة الصلاحيات مركزيًا.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">البريد الإلكتروني</Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="login-password">كلمة المرور</Label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              dir="ltr"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تسجيل الدخول'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
