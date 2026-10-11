import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Services from "@/pages/Services";
import Products from "@/pages/Products";
import Appointments from "@/pages/Appointments";
import VirtualTryOn from "@/pages/VirtualTryOn";
import Blog from "@/pages/Blog";
import Contact from "@/pages/Contact";
import Legal from "@/pages/Legal";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/services" component={Services} />
        <Route path="/products" component={Products} />
        <Route path="/appointments" component={Appointments} />
        <Route path="/virtual-try-on" component={VirtualTryOn} />
        <Route path="/blog" component={Blog} />
        <Route path="/contact" component={Contact} />
        <Route path="/legal" component={Legal} />
        <Route path="/privacy-policy" component={Legal} />
        <Route path="/terms" component={Legal} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

export default App;
