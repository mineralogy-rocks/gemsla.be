FROM node:25.1.0
ENV REFRESHED_AT "02-11-2025"

RUN curl -fsSL https://bun.sh/install | bash
RUN ln -s $HOME/.bun/bin/bun /usr/local/bin/bun

WORKDIR /app

EXPOSE 8080
CMD ["sh", "-c", "bun install && bun run dev"]