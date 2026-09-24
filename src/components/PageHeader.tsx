'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getMyTenant, logout } from '../api';
import { initialMetaStatus } from '../mockData';
import type { AuthUser } from '../types';
import { Header } from './Header';

// The inbox's Header for standalone pages (/dashboard): loads who's signed in, and
// sends header tabs to the inbox, which opens that view (/?tab=…).
export function PageHeader({
  activeTab,
  escalations = 0,
}: {
  activeTab: 'dashboard';
  escalations?: number;
}) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  const signOut = async () => {
    await logout();
    window.location.assign('/login');
  };

  useEffect(() => {
    getMyTenant()
      .then((t) => setUser({ id: t.id, email: '', businessName: t.name, ownerName: t.owner_name ?? t.name }))
      .catch(signOut); // same as the inbox: a dead session must clear the cookie, or /login bounces back
  }, []);

  return (
    <Header
      businessName={user?.businessName ?? ''}
      activeTab={activeTab}
      setActiveTab={(tab) => router.push(tab === 'inbox' ? '/' : `/?tab=${tab}`)}
      metaStatus={initialMetaStatus}
      unresolvedEscalationsCount={escalations}
      onOpenNewInboundModal={() => router.push('/?tab=inbound')}
      currentUser={user}
      onSignOut={signOut}
    />
  );
}
