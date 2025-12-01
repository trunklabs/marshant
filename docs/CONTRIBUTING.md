# Contributing to Marcurry Feature Flag

Thank you for your interest in contributing to Marcurry Feature Flag! This guide will help you get started with the development environment.

## Prerequisites

- Node.js (LTS version recommended)
- [pnpm](https://pnpm.io/) package manager

## Setting up the Project

### 1. Enable Corepack

First, enable corepack to ensure the correct package manager version is used:

```shell
corepack enable
```

### 2. Install Dependencies

Install all dependencies using pnpm:

```shell
pnpm install
```

### 3. Run Development Server

Launch compose services:

```shell
docker-compose up -d
```

Configure environment variables in `.env` files in services.

Start the development server:

```shell
pnpm dev
```

The application will be available at `http://localhost:3005`.

## Container Environment

### Build the Docker Image

Build the image from the project root:

```shell
docker build -t marcurry-web --target web .
```

### Run the Container

Run the Docker container:

```shell
docker run --rm -p 3005:3005 -e PORT=3005 --name marcurry-web marcurry-web
```

The application will be available at `http://localhost:3005`.

## Usage Examples

See [HTTP examples](./http-examples) for API usage examples.

## Getting Help

If you encounter any issues or have questions, please open an issue on GitHub.
