const DEFAULT_TITLE = "Argon Chatbot";

let pageTitle = DEFAULT_TITLE;
let unreadNotificationCount = 0;

const updateDocumentTitle = () => {
  const unreadPrefix = unreadNotificationCount
    ? `(${unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}) `
    : "";
  document.title = `${unreadPrefix}${pageTitle}`;
};

export const setPageTitle = (title) => {
  pageTitle = title || DEFAULT_TITLE;
  updateDocumentTitle();
};

export const setUnreadNotificationCount = (count) => {
  unreadNotificationCount = Math.max(0, Number(count) || 0);
  updateDocumentTitle();
};
