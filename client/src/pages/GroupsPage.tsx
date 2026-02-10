import { useEffect, useState } from 'react';
import { getUserGroups, createUserGroup, deleteUserGroup, getGroupMembers, addGroupMember, removeGroupMember } from '../services/userGroups';
import { getUserProfiles } from '../services/userProfiles';
import type { UserGroup, UserGroupMember, UserProfile } from '../types';
import { useAuthReady } from '../App';

export default function GroupsPage() {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [members, setMembers] = useState<UserGroupMember[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const authReady = useAuthReady();

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [g, u] = await Promise.all([getUserGroups(), getUserProfiles()]);
      setGroups(g);
      setUsers(u);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'שגיאה בטעינת קבוצות');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (authReady) load(); }, [authReady]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createUserGroup(form);
    setForm({ name: '', description: '' });
    setShowForm(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('למחוק את הקבוצה?')) return;
    await deleteUserGroup(id);
    if (expandedGroup === id) setExpandedGroup(null);
    load();
  }

  async function toggleExpand(groupId: string) {
    if (expandedGroup === groupId) {
      setExpandedGroup(null);
      return;
    }
    setExpandedGroup(groupId);
    setMembers(await getGroupMembers(groupId));
  }

  async function handleAddMember() {
    if (!expandedGroup || !selectedUserId) return;
    await addGroupMember(expandedGroup, selectedUserId);
    setSelectedUserId('');
    setMembers(await getGroupMembers(expandedGroup));
  }

  async function handleRemoveMember(memberId: string) {
    if (!expandedGroup) return;
    await removeGroupMember(memberId);
    setMembers(await getGroupMembers(expandedGroup));
  }

  function getUserEmail(userId: string) {
    return users.find((u) => u.id === userId)?.email ?? userId.slice(0, 8) + '...';
  }

  if (loading) return <div className="flex justify-center p-10"><span className="loading loading-lg" /></div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">👥 קבוצות משתמשים ({groups.length})</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'ביטול' : '+ קבוצה חדשה'}
        </button>
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
          <span className="text-xs opacity-70">ייתכן שחסרות הרשאות RLS — ראה scripts/setup-rls.sql</span>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="card bg-base-100 shadow p-4 mb-6 flex flex-col gap-3">
          <input
            className="input input-bordered"
            placeholder="שם הקבוצה"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <textarea
            className="textarea textarea-bordered"
            placeholder="תיאור"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <button className="btn btn-primary btn-sm self-start">שמור</button>
        </form>
      )}

      <div className="flex flex-col gap-3">
        {groups.length === 0 && <p className="text-center opacity-50">אין קבוצות עדיין</p>}
        {groups.map((group) => (
          <div key={group.id} className="card bg-base-100 shadow">
            <div className="card-body p-4">
              <div className="flex justify-between items-center">
                <div className="cursor-pointer" onClick={() => toggleExpand(group.id)}>
                  <h3 className="font-bold">{group.name}</h3>
                  <p className="text-sm opacity-60">{group.description}</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-ghost btn-xs" onClick={() => toggleExpand(group.id)}>
                    {expandedGroup === group.id ? 'סגור' : 'חברים'}
                  </button>
                  <button className="btn btn-ghost btn-xs text-error" onClick={() => handleDelete(group.id)}>
                    מחק
                  </button>
                </div>
              </div>

              {expandedGroup === group.id && (
                <div className="mt-4 border-t pt-3">
                  <div className="flex gap-2 mb-3">
                    <select
                      className="select select-bordered select-sm flex-1"
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                    >
                      <option value="">בחר משתמש...</option>
                      {users
                        .filter((u) => !members.some((m) => m.user_id === u.id))
                        .map((u) => (
                          <option key={u.id} value={u.id}>{u.email}</option>
                        ))}
                    </select>
                    <button className="btn btn-primary btn-sm" onClick={handleAddMember} disabled={!selectedUserId}>
                      הוסף
                    </button>
                  </div>
                  {members.length === 0 ? (
                    <p className="text-sm opacity-50">אין חברים בקבוצה</p>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {members.map((m) => (
                        <li key={m.id} className="flex justify-between items-center bg-base-200 rounded px-3 py-1">
                          <span className="text-sm">{getUserEmail(m.user_id)}</span>
                          <button className="btn btn-ghost btn-xs text-error" onClick={() => handleRemoveMember(m.id)}>
                            הסר
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
