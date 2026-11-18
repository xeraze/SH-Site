import { PortalLayout } from "../components/PortalLayout";
import { ComingSoon } from "../components/ComingSoon";
import { restartTour } from "../components/tourRestart";

export function PatientsPage() {
  return (
    <PortalLayout title="Для пацієнтів">
      <p className="p-lead">
        Інформація для пацієнтів лікарні: відповіді на часті питання, вартість
        послуг та умови отримання допомоги.
      </p>

      <div className="p-block">
        <div className="p-block__head p-block__head--teal">Часті питання</div>
        <div className="p-block__body">
          <ul className="p-list">
            <li>
              <strong>Чи потрібна реєстрація?</strong> Структуру лікарні, оголошення та корисні посилання можна переглядати без реєстрації. Щоб
              заповнювати анкети й записуватися на прийом, зареєструйтеся (вкажіть
              email і пароль), а код підтвердження надійде на пошту.
            </li>
            <li>
              <strong>Які анкети є на порталі?</strong> Три типи: заявка на посаду,
              звернення (скарга, пропозиція, апеляція, повідомлення про помилку чи
              запитання) та запис на прийом. Усі вони зібрані в розділі «Анкети».
            </li>
            <li>
              <strong>Як записатися до лікаря?</strong> Відкрийте «Анкети» й
              оберіть тип «Запис на прийом»: опишіть скарги та бажану дату.
              Оператор кол-центру зв'яжеться для підтвердження.
            </li>
            <li>
              <strong>Де стежити за статусом?</strong> В особистому кабінеті, у
              розділі «Мої анкети»: там відображаються статуси заявок на посаду,
              звернень і записів на прийом. Діалог відкривається, щойно анкету
              почнуть розглядати.
            </li>
            <li>
              <strong>Чи надходять повідомлення на пошту?</strong> Так, якщо
              увімкнено сповіщення в налаштуваннях кабінету: листи приходять про
              зміну статусу та нові повідомлення в діалозі.
            </li>
            <li>
              <strong>Як видалити акаунт?</strong> У налаштуваннях кабінету можна
              подати запит на експорт своїх даних або видалення акаунта. Запит
              розглядає адміністрація сайту.
            </li>
          </ul>
        </div>
      </div>

      <div className="p-block">
        <div className="p-block__head p-block__head--teal">Путівник</div>
        <div className="p-block__body">
          <p className="cabinet-profile-note">
            Путівник показує підказки прямо на сторінці, а потрібні кнопки та
            розділи підсвічуються відповідною міткою! Якщо захочете пройти його ще раз, просто
            натисніть кнопку нижче!
          </p>
          <button type="button" className="portal-cta" onClick={restartTour}>
            Пройти путівник ще раз
          </button>
        </div>
      </div>

      <div className="p-block">
        <div className="p-block__head p-block__head--teal">Вартість послуг</div>
        <div className="p-block__body">
          <ComingSoon label="У розробці" />
        </div>
      </div>

      <div className="p-block">
        <div className="p-block__head p-block__head--teal">НСЗУ</div>
        <div className="p-block__body">
          <ComingSoon label="У розробці" />
        </div>
      </div>

      <div className="p-block">
        <div className="p-block__head p-block__head--teal">Страхування</div>
        <div className="p-block__body">
          <ComingSoon label="У розробці" />
        </div>
      </div>
    </PortalLayout>
  );
}
