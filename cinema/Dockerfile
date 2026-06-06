# Берем официальный легкий образ Python
FROM python:3.13-slim

# Задаем рабочую папку внутри контейнера, куда скопируется код
WORKDIR /app

# Запрещаем Python писать мусорные файлы кэша .pyc на диск контейнера
ENV PYTHONDONTWRITEBYTECODE=1
# Включаем моментальный вывод логов Django прямо в терминал докера
ENV PYTHONUNBUFFERED=1

# Копируем файл зависимостей
COPY requirements.txt /app/
# Устанавливаем библиотеки (включая psycopg2 для Postgres)
RUN pip install --no-cache-dir -r requirements.txt

# Копируем весь остальной код из папки cinema в контейнер
COPY . /app/

# Информируем, что бэк работает на порту 8000
EXPOSE 8000
