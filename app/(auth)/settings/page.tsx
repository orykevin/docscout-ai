"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TwoFactorTab from "./_components/TwoFactorTab";
import BillingTab from "./_components/BillingTab";

export default function SettingsPage() {
  return (
    <div className="min-h-screen w-full flex justify-center p-4">
      <Tabs className="w-full mx-auto max-w-5xl" defaultValue="billing">
        <TabsList>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="two-factor">Two Factor</TabsTrigger>
        </TabsList>
        <TabsContent value="billing" className="w-full max-w-5xl">
          <BillingTab />
        </TabsContent>
        <TabsContent value="two-factor" className="w-full max-w-5xl">
          <TwoFactorTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
