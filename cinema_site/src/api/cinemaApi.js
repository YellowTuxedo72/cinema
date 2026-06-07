const BASE_URL = 'http://31.129.106.22:8000/api';

export const cinemaApi = {
  // Получить фильмы для главной страницы (Афиши)
  getActiveMovies: async () => {
    const response = await fetch(`${BASE_URL}/movies/active`);
    if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);
    return response.json();
  },

  // Получить расписание на дату
    getSchedule: async (movieId, dateStr) => {
    let url = `${BASE_URL}/sessions/schedule?movie_id=${movieId}`;
    if (dateStr) {
        url += `&date_param=${dateStr}`;
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);
    return response.json();
    },
  // Получить карту зала сеанса
  getHallMap: async (sessionId) => {
    const response = await fetch(`${BASE_URL}/sessions/${sessionId}/map`);
    if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);
    return response.json();
  },

    // Добавьте этот метод в src/api/cinemaApi.js к остальным методам
  getGeneralSchedule: async (dateStr) => {
    const url = dateStr ? `${BASE_URL}/sessions/schedule?date_param=${dateStr}` : `${BASE_URL}/sessions/schedule`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);
    return response.json();
  },

};
