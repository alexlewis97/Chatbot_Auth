export default function SetupScreen() {
  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold">⚙️ הגדרת המערכת</h1>
          <p className="py-4">
            לא נמצאו הגדרות Supabase. יש ליצור קובץ <code className="badge">.env</code> בתיקיית <code className="badge">client/</code> עם הערכים הבאים:
          </p>
          <div className="mockup-code text-start" dir="ltr">
            <pre><code>VITE_SUPABASE_URL=https://your-project.supabase.co</code></pre>
            <pre><code>VITE_SUPABASE_ANON_KEY=your-anon-key-here</code></pre>
            <pre><code>VITE_SKIP_AUTH=false</code></pre>
          </div>
          <p className="py-4 text-sm opacity-70">
            לאחר הגדרת הקובץ, יש להפעיל מחדש את שרת הפיתוח.
          </p>
        </div>
      </div>
    </div>
  );
}
