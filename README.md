# Base42 — ניהול הרשאות צ'אטבוטים

מערכת לניהול הרשאות גישה לצ'אטבוטים — הגדרת צ'אטבוטים, קבוצות משתמשים, והקצאת הרשאות למשתמשים וקבוצות.

## ארכיטקטורה

- **Frontend:** React + Vite + TailwindCSS + DaisyUI (עברית RTL)
- **Backend:** Supabase (PostgREST) — ללא שרת צד-שרת
- **Auth:** Supabase Auth (עם תמיכה ב-skip-auth לפיתוח)
- **Provisioning:** סקריפט build-time שיוצר טבלאות אוטומטית

## מודל נתונים

| טבלה | תיאור |
|:------|:-------|
| `chatbots` | קטלוג צ'אטבוטים — שם, נושא, תיאור, סטטוס |
| `user_profiles` | פרופילי משתמשים — אימייל, שם תצוגה, הרשאת אדמין |
| `user_groups` | קבוצות משתמשים |
| `user_group_members` | שיוך משתמשים לקבוצות |
| `chatbot_permissions` | הרשאות גישה — מקשר צ'אטבוט למשתמש/קבוצה עם סוג הרשאה |

## התקנה

```bash
cd client
npm install
```

## הגדרת סביבה

צור קובץ `client/.env` על בסיס `.env.example`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_SKIP_AUTH=false
```

## Edge Function נדרשת

המערכת דורשת Edge Function בשם `create-table-runner` בפרויקט Supabase שלך, וכן RPC בשם `execute_create_table`. ראה את קובץ ה-steering ב-`.kiro/steering/rules.md` לקוד המלא.

## הרצה

```bash
# provisioning + dev server
npm run dev

# provisioning בלבד
npm run provision

# build לפרודקשן
npm run build
```

## הגדרת RLS

אם הטבלאות קיימות אבל הנתונים לא נטענים, יש להריץ את `client/scripts/setup-rls.sql` ב-Supabase SQL Editor כדי להוסיף מדיניות RLS מתירנית לפיתוח.

## מבנה הפרויקט

```
client/
├── scripts/
│   ├── provision.js        # יצירת טבלאות אוטומטית (build-time)
│   └── setup-rls.sql       # מדיניות RLS לפיתוח
├── src/
│   ├── services/           # שכבת גישה לנתונים (Supabase client)
│   ├── pages/              # דפי האפליקציה
│   ├── components/         # רכיבי UI משותפים
│   ├── types/              # TypeScript interfaces
│   ├── App.tsx             # ניתוב, auth, layout
│   └── main.tsx            # נקודת כניסה
├── .env.example
├── index.html
└── package.json
```

## דפים

- **לוח בקרה** — סטטיסטיקות: מספר צ'אטבוטים, קבוצות, הרשאות
- **צ'אטבוטים** — CRUD, הפעלה/כיבוי
- **קבוצות** — יצירת קבוצות, ניהול חברים
- **הרשאות** — הקצאת גישה לצ'אטבוטים למשתמשים או קבוצות (use/admin/view)
