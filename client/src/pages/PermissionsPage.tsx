import { useEffect, useState } from 'react';
import { getAllPermissions, grantUserPermission, grantGroupPermission, revokePermission } from '../services/permissions';
import { getChatbots } from '../services/chatbots';
import { getUserGroups } from '../services/userGroups';
import { getUserProfiles } from '../services/userProfiles';
import type { ChatbotPermission, Chatbot, UserGroup, UserProfile } from '../types';

type GrantMode = 'user' | 'group';

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<ChatbotPermission[]>([]);
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [grantMode, setGrantMode] = useState<GrantMode>('user');
  const [selectedChatbot, setSelectedChatbot] = useState('');
  const [selectedTarget, setSelectedTarget] = useState('');
  const [permType, setPermType] = useState('use');

  async function load() {
    setLoading(true);
    try {
      const [p, b, g, u] = await Promise.all([
        getAllPermissions(), getChatbots(), getUserGroups(), getUserProfiles(),
      ]);
      setPermissions(p);
      setChatbots(b);
      setGroups(g);
      setUsers(u);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleGrant(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedChatbot || !selectedTarget) return;
    if (grantMode === 'user') {
      await grantUserPermission(selectedChatbot, selectedTarget, permType);
    } else {
      await grantGroupPermission(selectedChatbot, selectedTarget, permType);
    }
    setSelectedChatbot('');
    setSelectedTarget('');
    setShowForm(false);
    load();
  }

  async function handleRevoke(id: string) {
    if (!confirm('לבטל הרשאה זו?')) return;
    await revokePermission(id);
    load();
  }

  function getChatbotName(id: string) {
    return chatbots.find((b) => b.id === id)?.name ?? id.slice(0, 8) + '...';
  }
  function getUserEmail(id: string) {
    return users.find((u) => u.id === id)?.email ?? id.slice(0, 8) + '...';
  }
  function getGroupName(id: string) {
    return groups.find((g) => g.id === id)?.name ?? id.slice(0, 8) + '...';
  }

  function getTargetLabel(perm: ChatbotPermission) {
    if (perm.user_id) return `👤 ${getUserEmail(perm.user_id)}`;
    if (perm.group_id) return `👥 ${getGroupName(perm.group_id)}`;
    return '—';
  }

  if (loading) return <div className="flex justify-center p-10"><span className="loading loading-lg" /></div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🔐 הרשאות צ'אטבוטים</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'ביטול' : '+ הרשאה חדשה'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleGrant} className="card bg-base-100 shadow p-4 mb-6 flex flex-col gap-3">
          <div className="flex gap-2">
            <label className="label cursor-pointer gap-2">
              <input
                type="radio"
                className="radio radio-sm"
                checked={grantMode === 'user'}
                onChange={() => { setGrantMode('user'); setSelectedTarget(''); }}
              />
              <span>משתמש</span>
            </label>
            <label className="label cursor-pointer gap-2">
              <input
                type="radio"
                className="radio radio-sm"
                checked={grantMode === 'group'}
                onChange={() => { setGrantMode('group'); setSelectedTarget(''); }}
              />
              <span>קבוצה</span>
            </label>
          </div>

          <select
            className="select select-bordered"
            value={selectedChatbot}
            onChange={(e) => setSelectedChatbot(e.target.value)}
            required
          >
            <option value="">בחר צ'אטבוט...</option>
            {chatbots.map((b) => (
              <option key={b.id} value={b.id}>{b.name} — {b.subject}</option>
            ))}
          </select>

          <select
            className="select select-bordered"
            value={selectedTarget}
            onChange={(e) => setSelectedTarget(e.target.value)}
            required
          >
            <option value="">
              {grantMode === 'user' ? 'בחר משתמש...' : 'בחר קבוצה...'}
            </option>
            {grantMode === 'user'
              ? users.map((u) => <option key={u.id} value={u.id}>{u.email}</option>)
              : groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)
            }
          </select>

          <select
            className="select select-bordered"
            value={permType}
            onChange={(e) => setPermType(e.target.value)}
          >
            <option value="use">שימוש (use)</option>
            <option value="admin">ניהול (admin)</option>
            <option value="view">צפייה (view)</option>
          </select>

          <button className="btn btn-primary btn-sm self-start">הענק הרשאה</button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="table table-zebra bg-base-100 shadow rounded-box">
          <thead>
            <tr>
              <th>צ'אטבוט</th>
              <th>יעד</th>
              <th>סוג הרשאה</th>
              <th>תאריך</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {permissions.length === 0 && (
              <tr><td colSpan={5} className="text-center opacity-50">אין הרשאות עדיין</td></tr>
            )}
            {permissions.map((perm) => (
              <tr key={perm.id}>
                <td className="font-medium">{getChatbotName(perm.chatbot_id)}</td>
                <td>{getTargetLabel(perm)}</td>
                <td>
                  <span className={`badge badge-sm ${
                    perm.permission_type === 'admin' ? 'badge-error' :
                    perm.permission_type === 'use' ? 'badge-primary' : 'badge-ghost'
                  }`}>
                    {perm.permission_type}
                  </span>
                </td>
                <td className="text-sm opacity-60">
                  {new Date(perm.granted_at).toLocaleDateString('he-IL')}
                </td>
                <td>
                  <button className="btn btn-ghost btn-xs text-error" onClick={() => handleRevoke(perm.id)}>
                    בטל
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
