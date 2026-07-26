import { Link } from "react-router-dom";
import { Stamp } from "../components/Stamp";
import { ComingSoon } from "../components/ComingSoon";
import "./AboutPage.css";

export function AboutPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Stamp>КНП · Слобідська МР · Про заклад</Stamp>
          <h1>Про лікарню</h1>
          <p className="page-hero__lede">
            КНП «Слобідська ЦРЛ» СМР — медичний заклад, що об'єднує
            поліклінічну, стаціонарну та консультативно-діагностичну
            допомогу в межах рольового проєкту.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container about-grid">
          <div className="about-card">
            <span className="about-card__label">Повна назва</span>
            <p>
              Комунальне некомерційне підприємство «Слобідська центральна
              районна лікарня» Слобідської міської ради
            </p>
          </div>
          <div className="about-card">
            <span className="about-card__label">Скорочена назва</span>
            <p>КНП «СЦРЛ» СМР</p>
          </div>
          <div className="about-card">
            <span className="about-card__label">Форма власності</span>
            <p>Комунальне некомерційне підприємство</p>
          </div>
          <div className="about-card">
            <span className="about-card__label">Підпорядкування</span>
            <p>Слобідська міська рада</p>
          </div>
        </div>
      </section>

      <section className="section about-topic">
        <div className="container">
          <span className="eyebrow">Досягнення</span>
          <h2 className="about-topic__title">Досягнення лікарні</h2>
          <ComingSoon />
        </div>
      </section>

      <section className="section about-topic">
        <div className="container">
          <span className="eyebrow">Ургентна допомога</span>
          <h2 className="about-topic__title">Ургентність</h2>
          <ComingSoon />
        </div>
      </section>

      <section className="section about-topic">
        <div className="container">
          <span className="eyebrow">Обстеження</span>
          <h2 className="about-topic__title">Діагностика</h2>
          <ComingSoon />
        </div>
      </section>

      <section className="section about-topic">
        <div className="container">
          <span className="eyebrow">Персонал</span>
          <h2 className="about-topic__title">Лікарі</h2>
          <p className="about-topic__lede">
            Повний перелік лікарів та іншого персоналу лікарні — на сторінці
            «Структура».
          </p>
          <Link to="/viddilennya" className="btn btn--primary">
            Перейти до структури
          </Link>
        </div>
      </section>
    </>
  );
}