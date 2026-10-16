import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Link } from "../components/AppLink";
import { departments } from "../data/hierarchy";
import "./PortalLayout.css";

const SIDEBAR_LINKS = [
  { to: "/", label: "Головна сторінка" },
  { to: "/pro-likarniu", label: "Про лікарню" },
  { to: "/viddilennya", label: "Відділення лікарні" },
  { to: "/spivrobitnyky", label: "Працівники" },
  { to: "/dlya-pacientiv", label: "Для пацієнтів" },
  { to: "/zayavky", label: "Подати заявку" },
  { to: "/kabinet", label: "Особистий кабінет" },
  { to: "/kontakty", label: "Контакти" },
];

const RIGHT_LINKS = [
  { to: "/dlya-pacientiv", label: "Порядок надання допомоги" },
  { to: "/viddilennya", label: "Структура закладу" },
  { to: "/zayavky", label: "Звернення громадян" },
  { to: "/spivrobitnyky", label: "Керівництво" },
  { to: "/kontakty", label: "Реквізити та адреса" },
];

interface PortalLayoutProps {
  title: string;
  children: ReactNode;
  aside?: ReactNode;
}

export function PortalLayout({ title, children, aside }: PortalLayoutProps) {
  const { pathname } = useLocation();

  return (
    <div className="portal">
      <div className="container portal__crumbs">
        <Link to="/">Головна</Link>
        <span aria-hidden="true">›</span>
        <span>{title}</span>
      </div>

      <div className="container portal__grid">
        <aside className="portal__left">
          <nav className="portal-box" aria-label="Меню розділів">
            <div className="portal-box__head">Меню сайту</div>
            <ul className="portal-menu">
              {SIDEBAR_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className={`portal-menu__link${pathname === link.to ? " portal-menu__link--active" : ""}`}
                  >
                    <span className="portal-menu__marker" aria-hidden="true">
                      ▸
                    </span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="portal-box">
            <div className="portal-box__head">Відділення</div>
            <ul className="portal-menu">
              {departments.slice(0, 8).map((dept) => (
                <li key={dept.id}>
                  <Link to={`/viddilennya/${dept.id}`} className="portal-menu__link">
                    <span className="portal-menu__marker" aria-hidden="true">
                      ▸
                    </span>
                    {dept.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="portal__main">
          <h1 className="portal__title">{title}</h1>
          {children}
        </main>

        <aside className="portal__right">
          <div className="portal-box">
            <div className="portal-box__head">Корисні посилання</div>
            <ul className="portal-menu">
              {RIGHT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="portal-menu__link">
                    <span className="portal-menu__marker" aria-hidden="true">
                      ▸
                    </span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="portal-box">
            <div className="portal-box__head">Звернення</div>
            <div className="portal-box__body portal-box__body--text">
              <p>
                Залишили питання або знайшли помилку на сайті? Подайте
                електронну заявку — її розгляне адміністрація проєкту.
              </p>
              <Link to="/zayavky" className="portal-cta">
                Подати заявку онлайн
              </Link>
            </div>
          </div>

          <div className="portal-box">
            <div className="portal-box__head">Про проєкт</div>
            <div className="portal-box__body portal-box__body--text">
              <p>
                КНП "Слобідська ЦРЛ" СМР — медичний рольовий проєкт спільноти
                Roblox. Офіційний веб-портал для пацієнтів та учасників.
              </p>
            </div>
          </div>

          {aside}
        </aside>
      </div>
    </div>
  );
}
