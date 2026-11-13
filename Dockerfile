FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

WORKDIR /app

COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY . /app

RUN python backend/manage.py migrate \
    && python backend/manage.py seed_participants \
    && python backend/manage.py collectstatic --no-input

EXPOSE 8000

CMD ["sh", "-c", "gunicorn --chdir backend config.wsgi:application --bind 0.0.0.0:${PORT:-8000}"]
