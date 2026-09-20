FROM oven/bun:1-alpine
WORKDIR /app

# Salin file dependency
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Salin seluruh kode backend
COPY . .

EXPOSE 3000

# Push schema ke database (jika terhubung), lalu jalankan ElysiaJS server
CMD ["sh", "-c", "bun run db:push || true && bun run start"]
