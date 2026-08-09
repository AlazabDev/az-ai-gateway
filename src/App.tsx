import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AuthProvider } from "@/hooks/useAuth";
import { PageLoader } from "@/components/loading/PageLoader";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// Eager: the two entry screens every visitor hits first.
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy: everything else. These pull in mermaid / three / katex / html2canvas /
// cytoscape, which previously shipped in the initial bundle (~4.5 MB) and were
// downloaded even to reach the login screen.
const Integrations = lazy(() => import("./pages/Integrations"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Settings = lazy(() => import("./pages/Settings"));
const WhatsApp = lazy(() => import("./pages/WhatsApp"));
const Azure = lazy(() => import("./pages/Azure"));
const AzureSettings = lazy(() => import("./pages/AzureSettings"));
const AzureContextPage = lazy(() => import("./pages/azure/AzureContextPage"));
const VisionOCR = lazy(() => import("./pages/services/VisionOCR"));
const DocumentIntelligence = lazy(() => import("./pages/services/DocumentIntelligence"));
const AIProcessing = lazy(() => import("./pages/services/AIProcessing"));
const MaintenanceSearch = lazy(() => import("./pages/services/MaintenanceSearch"));
const QAAgent = lazy(() => import("./pages/services/QAAgent"));
const ArchERP = lazy(() => import("./pages/services/ArchERP"));
const EngineeringTools = lazy(() => import("./pages/EngineeringTools"));
const ProductivityTools = lazy(() => import("./pages/ProductivityTools"));
const ArchitectureAnalysis = lazy(() => import("./pages/ArchitectureAnalysis"));
const FinanceAnalysis = lazy(() => import("./pages/FinanceAnalysis"));
const FinanceModule = lazy(() => import("./pages/finance/FinanceModule"));
const ContractsGenerator = lazy(() => import("./pages/tools/ContractsGenerator"));
const SmartReports = lazy(() => import("./pages/tools/SmartReports"));
const TaskBoard = lazy(() => import("./pages/tools/TaskBoard"));
const SpeechStudio = lazy(() => import("./pages/SpeechStudio"));
const AzureFoundryHub = lazy(() => import("./pages/AzureFoundryHub"));
const GoogleSheets = lazy(() => import("./pages/GoogleSheets"));

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<PageLoader message="جارٍ التحميل..." />}>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                  <Route path="/integrations" element={<ProtectedRoute><Integrations /></ProtectedRoute>} />
                  <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="/whatsapp" element={<ProtectedRoute><WhatsApp /></ProtectedRoute>} />
                  <Route path="/azure" element={<ProtectedRoute><Azure /></ProtectedRoute>} />
                  <Route path="/azure/foundry" element={<ProtectedRoute><AzureFoundryHub /></ProtectedRoute>} />
                  <Route path="/azure/settings" element={<ProtectedRoute><AzureSettings /></ProtectedRoute>} />
                  <Route path="/azure/vision" element={<ProtectedRoute><AzureContextPage contextId="vision" /></ProtectedRoute>} />
                  <Route path="/azure/finance" element={<ProtectedRoute><AzureContextPage contextId="finance" /></ProtectedRoute>} />
                  <Route path="/azure/agents/maintenance" element={<ProtectedRoute><AzureContextPage contextId="maintenance-agent" /></ProtectedRoute>} />
                  <Route path="/azure/agents/production" element={<ProtectedRoute><AzureContextPage contextId="production-agent" /></ProtectedRoute>} />
                  <Route path="/azure/speech" element={<ProtectedRoute><AzureContextPage contextId="speech-voice" /></ProtectedRoute>} />
                  <Route path="/services/vision" element={<ProtectedRoute><VisionOCR /></ProtectedRoute>} />
                  <Route path="/services/docint" element={<ProtectedRoute><DocumentIntelligence /></ProtectedRoute>} />
                  <Route path="/services/ai-processing" element={<ProtectedRoute><AIProcessing /></ProtectedRoute>} />
                  <Route path="/services/search" element={<ProtectedRoute><MaintenanceSearch /></ProtectedRoute>} />
                  <Route path="/services/agent" element={<ProtectedRoute><QAAgent /></ProtectedRoute>} />
                  <Route path="/services/arch-erp" element={<ProtectedRoute><ArchERP /></ProtectedRoute>} />
                  <Route path="/engineering" element={<ProtectedRoute><EngineeringTools /></ProtectedRoute>} />
                  <Route path="/productivity" element={<ProtectedRoute><ProductivityTools /></ProtectedRoute>} />
                  <Route path="/architecture" element={<ProtectedRoute><ArchitectureAnalysis /></ProtectedRoute>} />
                  <Route path="/finance" element={<ProtectedRoute><FinanceAnalysis /></ProtectedRoute>} />
                  <Route path="/finance/module" element={<ProtectedRoute><FinanceModule /></ProtectedRoute>} />
                  <Route path="/tools/contracts" element={<ProtectedRoute><ContractsGenerator /></ProtectedRoute>} />
                  <Route path="/tools/reports" element={<ProtectedRoute><SmartReports /></ProtectedRoute>} />
                  <Route path="/tools/tasks" element={<ProtectedRoute><TaskBoard /></ProtectedRoute>} />
                  <Route path="/tools/speech" element={<ProtectedRoute><SpeechStudio /></ProtectedRoute>} />
                  <Route path="/google-sheets" element={<ProtectedRoute><GoogleSheets /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
