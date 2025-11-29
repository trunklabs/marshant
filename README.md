# Setting up the Project

Enable corepack with

```shell
corepack enable
```

Install dependencies with

```shell
pnpm install
```

Run app

```shell
pnpm dev
```

# Container Environment

Build the image from the root

```shell
docker build -t marcurry-web --target web .
```

Run

```shell
docker run --rm -p 3000:3000 -e PORT=3000 --name marcurry-web marcurry-web
```

# Usage examples

See [docs](./docs/http-examples)

# ERD

![](./docs/erd.png)
