import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, ShieldCheck, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type AuthorizationDetails = {
  authorization_id: string;
  client: {
    name?: string | null;
    client_id?: string | null;
    uri?: string | null;
  };
  scope?: string | null;
  redirect_uri?: string | null;
};

export default function OAuthConsent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { session, loading: authLoading } = useAuth();
  const authorizationId = searchParams.get('authorization_id');

  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<'approve' | 'deny' | null>(null);

  const scopes = useMemo(
    () => details?.scope?.split(/\s+/).filter(Boolean) ?? [],
    [details?.scope],
  );

  useEffect(() => {
    if (authLoading) return;

    if (!authorizationId) {
      setError('طلب التفويض غير صالح: authorization_id غير موجود.');
      return;
    }

    if (!session) {
      const returnPath = `${location.pathname}${location.search}`;
      navigate(`/auth?redirect=${encodeURIComponent(returnPath)}`, { replace: true });
      return;
    }

    let active = true;

    void supabase.auth.oauth
      .getAuthorizationDetails(authorizationId)
      .then(({ data, error: authError }) => {
        if (!active) return;

        if (authError || !data) {
          setError(authError?.message ?? 'تعذر قراءة تفاصيل طلب التفويض.');
          return;
        }

        if (!('authorization_id' in data)) {
          window.location.assign(data.redirect_url);
          return;
        }

        setDetails(data as AuthorizationDetails);
      });

    return () => {
      active = false;
    };
  }, [authLoading, authorizationId, location.pathname, location.search, navigate, session]);

  const decide = async (decision: 'approve' | 'deny') => {
    if (!authorizationId || submitting) return;

    setSubmitting(decision);
    setError(null);

    const result =
      decision === 'approve'
        ? await supabase.auth.oauth.approveAuthorization(authorizationId)
        : await supabase.auth.oauth.denyAuthorization(authorizationId);

    if (result.error || !result.data?.redirect_url) {
      setError(result.error?.message ?? 'تعذر إكمال قرار التفويض.');
      setSubmitting(null);
      return;
    }

    window.location.assign(result.data.redirect_url);
  };

  if (authLoading || (!error && !details)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="w-full max-w-lg p-8 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            <h1 className="text-2xl font-bold">تفويض الوصول إلى Alazab AI</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            راجع التطبيق والصلاحيات المطلوبة قبل السماح بالوصول.
          </p>
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : (
          <>
            <div className="rounded-lg border p-4 space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">التطبيق</span>
                <p className="font-semibold">{details?.client?.name || 'OAuth client'}</p>
              </div>
              {details?.client?.client_id && (
                <div>
                  <span className="text-sm text-muted-foreground">Client ID</span>
                  <p className="font-mono text-xs break-all" dir="ltr">
                    {details.client.client_id}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h2 className="font-semibold">الصلاحيات المطلوبة</h2>
              <div className="flex flex-wrap gap-2">
                {scopes.length > 0 ? (
                  scopes.map((scope) => (
                    <span key={scope} className="rounded-md border px-2 py-1 text-xs font-mono" dir="ltr">
                      {scope}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">لم يحدد التطبيق صلاحيات إضافية.</span>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={() => void decide('approve')}
                disabled={submitting !== null}
              >
                {submitting === 'approve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                سماح
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => void decide('deny')}
                disabled={submitting !== null}
              >
                {submitting === 'deny' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldX className="h-4 w-4" />}
                رفض
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
