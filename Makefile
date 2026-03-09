# Makefile for NestJS + Prisma (SQLite) + pnpm
# Usage examples:
#   make install
#   make dev
#   make prisma-migrate name=init
#   make prisma-studio

SHELL := /bin/bash

# Use pnpm (fail fast if not installed)
PNPM := pnpm

# prisma commands via pnpm dlx (doesn't require global prisma)
PRISMA := $(PNPM) dlx prisma

# Default env (override like: make dev PORT=4000)
PORT ?= 3000

.PHONY: help install dev build start lint test clean \
        prisma-init prisma-generate prisma-migrate prisma-deploy prisma-reset prisma-studio prisma-format prisma-status

help:
	@echo "Targets:"
	@echo "  install             Install dependencies (pnpm)"
	@echo "  dev                 Run Nest in watch mode"
	@echo "  build               Build Nest project"
	@echo "  start               Start built app"
	@echo "  lint                Lint"
	@echo "  test                Run tests"
	@echo "  clean               Remove build artifacts"
	@echo ""
	@echo "Prisma targets:"
	@echo "  prisma-init         Initialize Prisma (SQLite provider)"
	@echo "  prisma-generate     Generate Prisma client"
	@echo "  prisma-migrate      Create & apply dev migration: make prisma-migrate name=init"
	@echo "  prisma-deploy       Apply migrations (prod-style)"
	@echo "  prisma-reset        Reset DB (DANGEROUS: deletes data)"
	@echo "  prisma-studio       Open Prisma Studio"
	@echo "  prisma-format       Format prisma/schema.prisma"
	@echo "  prisma-status       Show migration status"

install:
	$(PNPM) install

dev:
	PORT=$(PORT) $(PNPM) run start:dev

build:
	$(PNPM) run build

start:
	PORT=$(PORT) $(PNPM) run start

lint:
	$(PNPM) run lint

test:
	$(PNPM) run test

clean:
	rm -rf dist

# ---------- Prisma ----------
prisma-init:
	$(PRISMA) init --datasource-provider sqlite

prisma-generate:
	$(PRISMA) generate

# Usage: make prisma-migrate name=init
prisma-migrate:
	@if [ -z "$(name)" ]; then \
	  echo "ERROR: missing migration name. Example: make prisma-migrate name=init"; \
	  exit 1; \
	fi
	$(PRISMA) migrate dev --name "$(name)"

prisma-deploy:
	$(PRISMA) migrate deploy

prisma-reset:
	$(PRISMA) migrate reset

prisma-studio:
	$(PRISMA) studio

prisma-format:
	$(PRISMA) format

prisma-status:
	$(PRISMA) migrate status