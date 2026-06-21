import BlackCatalogPageContent from ".";
import type { BlackCatalogPageContentTexts } from "./types";

const texts: BlackCatalogPageContentTexts = {
  pageTitle: "Черный список",
  emptyStateTitle: "Черный список",
  emptyStateDescription:
    "Введите ФИО клиента (минимум 5 символов) для поиска в чёрном каталоге.",
  notFoundTitle: "Запись в чёрном каталоге не найдена",
  notFoundDescription: (query) =>
    `По вашему запросу "${query}" ничего не найдено.`,
  deleteConfirmText: (fullname) =>
    `Вы уверены, что хотите удалить ${fullname} из чёрного каталога?`,
};

const BlackCatalogPage = () => {
  return <BlackCatalogPageContent texts={texts} showDebtSection={false} />;
};

export default BlackCatalogPage;
