import { Link } from "../components/AppLink";
import { PortalLayout } from "../components/PortalLayout";
import { ComingSoon } from "../components/ComingSoon";

export function AboutPage() {
  return (
    <PortalLayout title="Про лікарню">
      <p className="p-lead">
        КНП "Слобідська ЦРЛ" СМР — медичний заклад, що об'єднує
        поліклінічну, стаціонарну та консультативно-діагностичну допомогу
        в межах рольового проєкту.
      </p>

      <div className="p-block">
        <div className="p-block__head">Відомості про заклад</div>
        <div className="p-block__body">
          <table className="p-table">
            <tbody>
              <tr>
                <th>Повна назва</th>
                <td>
                  Комунальне некомерційне підприємство "Слобідська центральна
                  районна лікарня" Слобідської міської ради
                </td>
              </tr>
              <tr>
                <th>Скорочена назва</th>
                <td>КНП "СЦРЛ" СМР</td>
              </tr>
              <tr>
                <th>Форма власності</th>
                <td>Комунальне некомерційне підприємство</td>
              </tr>
              <tr>
                <th>Підпорядкування</th>
                <td>Слобідська міська рада</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-block">
        <div className="p-block__head p-block__head--teal">Досягнення лікарні</div>
        <div className="p-block__body">
          <ComingSoon />
        </div>
      </div>

      <div className="p-block">
        <div className="p-block__head p-block__head--teal">Ургентна допомога</div>
        <div className="p-block__body">
          <ComingSoon />
        </div>
      </div>

      <div className="p-block">
        <div className="p-block__head p-block__head--teal">Діагностика</div>
        <div className="p-block__body">
          <ComingSoon />
        </div>
      </div>

      <div className="p-block">
        <div className="p-block__head p-block__head--teal">Лікарі та персонал</div>
        <div className="p-block__body">
          <p style={{ marginBottom: "0.8rem", fontSize: "0.9rem", color: "var(--color-ink-soft)" }}>
            Повний перелік лікарів та іншого персоналу лікарні — у розділі
            "Відділення".
          </p>
          <Link to="/viddilennya" className="portal-cta" style={{ width: "fit-content", paddingInline: "1.2rem" }}>
            Перейти до структури
          </Link>
        </div>
      </div>
    </PortalLayout>
  );
}
