import { useEffect, useState } from 'react';
import { getChatbots } from '../services/chatbots';
import { getUserGroups } from '../services/userGroups';
import { getAllPermissions } from '../services/permissions';
import { useAuthReady } from '../App';

export default function DashboardPage() {
  const [stats, setStats] = useState({ chatbots: 0, groups: 0, permissions: 0 });
  const [loading, setLoading] = useState(true);
  const authReady = useAuthReady();

  useEffect(() => {
    if (!authReady) return;
    Promise.all([getChatbots(), getUserGroups(), getAllPermissions()])
      .then(([bots, groups, perms]) => {
        setStats({ chatbots: bots.length, groups: groups.length, permissions: perms.length });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authReady]);

  if (loading) return <div className="flex justify-center p-10"><span className="loading loading-lg" /></div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">לוח בקרה</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-title">צ'אטבוטים</div>
          <div className="stat-value text-primary">{stats.chatbots}</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-title">קבוצות משתמשים</div>
          <div className="stat-value text-secondary">{stats.groups}</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-title">הרשאות פעילות</div>
          <div className="stat-value text-accent">{stats.permissions}</div>
        </div>
      </div>
    </div>
  );
}
