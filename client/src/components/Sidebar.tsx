import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: '📊 לוח בקרה' },
  { to: '/chatbots', label: '🤖 צ\'אטבוטים' },
  { to: '/groups', label: '👥 קבוצות' },
  { to: '/permissions', label: '🔐 הרשאות' },
];

export default function Sidebar() {
  return (
    <aside className="w-56 bg-base-100 border-l border-base-300 min-h-[calc(100vh-4rem)]">
      <ul className="menu p-4 gap-1">
        {links.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              className={({ isActive }) => isActive ? 'active font-bold' : ''}
            >
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>
  );
}
