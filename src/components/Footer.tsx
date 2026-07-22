import { Link } from "react-router-dom";
import "./Footer.css";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__col">
          <strong className="footer__title">КНП «Слобідська ЦРЛ» СМР</strong>
          <p className="footer__text">
            Комунальне некомерційне підприємство «Слобідська центральна районна
            лікарня» Слобідської міської ради.
          </p>
          <p className="footer__note">
            Медичний рольовий проєкт спільноти Roblox. Довідковий центр створено
            для зручності учасників.
          </p>
        </div>

        <div className="footer__col">
          <strong className="footer__title">Розділи</strong>
          <ul className="footer__links">
            <li><Link to="/pro-likarniu">Про лікарню</Link></li>
            <li><Link to="/spivrobitnyky">Персонал</Link></li>
            <li><Link to="/kontakty">Контакти</Link></li>
            <li><Link to="/portal">Портал для лікарів</Link></li>
          </ul>
        </div>

        <div className="footer__col">
          <strong className="footer__title">Спільнота</strong>
          <ul className="footer__links">
            <li>
              <a href="https://discord.com/channels/1465334351452569800/1466418410035482706" target="_blank" rel="noreferrer">
                Центр підтримки
              </a>
            </li>
            <li>
              <a href="https://discord.com/channels/1465334351452569800/1465695682227601704" target="_blank" rel="noreferrer">
                Графік сесій
              </a>
            </li>
            <li>
              <a href="https://www.roblox.com/share?code=9687247321d6614a842c75669b6f7218&type=ExperienceDetails" target="_blank" rel="noreferrer">
                Гра в Roblox
              </a>
            </li>
            <li>
              <a href="https://www.roblox.com/share/g/558657762" target="_blank" rel="noreferrer">
                Група в Roblox
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer__bottom container">
        <span>© {new Date().getFullYear()} Слобідська ЦРЛ. Рольовий проєкт спільноти.</span>
      </div>
    </footer>
  );
}
