import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { api } from '../../services/api';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const AppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: status } = useQuery({
    queryKey: ['wcStatus'],
    queryFn: () => api.woocommerce.getStatus(),
    refetchInterval: 30000,
  });

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <Sidebar
        isMockMode={status?.isMock}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header
          integration={status}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 bg-muted/20">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
