import { Stamp } from "../components/Stamp";
import { ComingSoon } from "../components/ComingSoon";
import "./AboutPage.css";

export function PatientsPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Stamp>КНП · Слобідська МР · Для пацієнтів</Stamp>
          <h1>Для пацієнтів</h1>
          <p className="page-hero__lede">
            Інформація для пацієнтів лікарні: путівник, вартість послуг та
            умови отримання допомоги.
          </p>
        </div>
      </section>

      <section className="section about-topic">
        <div className="container">
          <span className="eyebrow">Орієнтація в закладі</span>
          <h2 className="about-topic__title">Путівник лікарнею</h2>
          <ComingSoon />
        </div>
      </section>

      <section className="section about-topic">
        <div className="container">
          <span className="eyebrow">Оплата</span>
          <h2 className="about-topic__title">Вартість послуг</h2>
          <ComingSoon />
        </div>
      </section>

      <section className="section about-topic">
        <div className="container">
          <span className="eyebrow">Державна програма</span>
          <h2 className="about-topic__title">НСЗУ</h2>
          <ComingSoon />
        </div>
      </section>

      <section className="section about-topic">
        <div className="container">
          <span className="eyebrow">Додаткові умови</span>
          <h2 className="about-topic__title">Страхування</h2>
          <ComingSoon />
        </div>
      </section>
    </>
  );
}