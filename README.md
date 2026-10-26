# Sanchar Front

Sanchar Front is the Next.js web client for the Sanchar AI commerce platform. It provides a customer support inbox for Instagram, WhatsApp, and Facebook conversations, an AI-assisted reply workflow, and a business dashboard for managing conversations, staff, knowledge, and connected social channels.

This repository is the frontend layer of the full Sanchar system and expects a FastAPI backend to provide the `/api/v1` endpoints used by the UI.

## Features

- Omnichannel inbox for customer conversations across multiple channels
- AI reply flow with confidence scoring and escalation handling
- Knowledge base / shop info management for RAG-driven answers
- Dashboard and monitoring views for message volume and open handovers
- Social account management for Meta connections
- Staff and tenant management for admins and owners
- Public demo mode for showcasing the app without a live backend session
- Docker-ready deployment configuration

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Docker

## Repository Structure

- `app/` — App Router pages and layout used by the Next.js frontend
- `src/` — UI logic, API client, mock data, and core components
- `public/` — Public static assets
- `middleware.ts` — authentication and API proxy logic
- `next.config.ts` — standalone Next.js build configuration
- `.env.example` — sample environment file
- `Dockerfile` — multi-stage production image for the frontend
- `docker-compose.yml` — local container setup

## Prerequisites

- Node.js 20+
- npm
- A running Sanchar backend exposing `/api/v1` routes

## Getting Started

1. Install dependencies:

   ```bash
   npm install
 
