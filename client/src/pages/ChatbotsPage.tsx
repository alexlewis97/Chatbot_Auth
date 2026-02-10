import { useEffect, useState } from 'react';
import { getChatbots, createChatbot, deleteChatbot, updateChatbot } from '../services/chatbots';
import type { Chatbot } from '../types';

export default function ChatbotsPage() {
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', subject: '', description: '' });

  async function load() {
    setLoading(true);
    try {
      setChatbots(await getChatbots());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createChatbot(form);
    setForm({ name: '', subject: '', description: '' });
    setShowForm(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('למחוק את הצ\'אטבוט?')) return;
    await deleteChatbot(id);
    load();
  }

  async function handleToggleActive(bot: Chatbot) {
    await updateChatbot(bot.id, { is_active: !bot.is_active });
    load();
  }

  if (loading) return <div className="flex justify-center p-10"><span className="loading loading-lg" /></div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🤖 צ'אטבוטים</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'ביטול' : '+ צ\'אטבוט חדש'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card bg-base-100 shadow p-4 mb-6 flex flex-col gap-3">
          <input
            className="input input-bordered"
            placeholder="שם הצ'אטבוט"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="input input-bordered"
            placeholder="נושא"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
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

      <div className="overflow-x-auto">
        <table className="table table-zebra bg-base-100 shadow rounded-box">
          <thead>
            <tr>
              <th>שם</th>
              <th>נושא</th>
              <th>תיאור</th>
              <th>סטטוס</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {chatbots.length === 0 && (
              <tr><td colSpan={5} className="text-center opacity-50">אין צ'אטבוטים עדיין</td></tr>
            )}
            {chatbots.map((bot) => (
              <tr key={bot.id}>
                <td className="font-medium">{bot.name}</td>
                <td>{bot.subject}</td>
                <td className="max-w-xs truncate">{bot.description}</td>
                <td>
                  <input
                    type="checkbox"
                    className="toggle toggle-success toggle-sm"
                    checked={bot.is_active}
                    onChange={() => handleToggleActive(bot)}
                  />
                </td>
                <td>
                  <button className="btn btn-ghost btn-xs text-error" onClick={() => handleDelete(bot.id)}>
                    מחק
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
