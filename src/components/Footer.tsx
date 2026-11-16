import { Icon } from "@iconify/react";
import { Link } from "../components/AppLink";
import "./Footer.css";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__col">
          <strong className="footer__title">КНП "Слобідська ЦРЛ" СМР</strong>
          <p className="footer__text">
            Комунальне некомерційне підприємство "Слобідська центральна районна
            лікарня" Слобідської міської ради.
          </p>
          <p className="footer__note">
            Медичний рольовий проект розроблений на платформі Roblox.
            Офіційний веб-портал який створено для зручності{" "}
            <span className="footer__note-ending">
              гравців!
              <Icon icon="mdi:heart" width={12} height={12} className="footer__heart" />
            </span>
          </p>
        </div>

        <div className="footer__col">
          <strong className="footer__title">Правова інформація</strong>
          <ul className="footer__links">
            <li>
              <Link to="/polityka-konfidenciynosti">
                Політика конфіденційності
              </Link>
            </li>
            <li>
              <Link to="/umovy-korystuvannya">
                Умови користування
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer__bottom container">
        <span>
          © {new Date().getFullYear()} Слобідська ЦРЛ. Рольовий проєкт спільноти.
        </span>
      </div>
    </footer>
  );
}
