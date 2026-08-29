# Desplegar ZeroSlop

Dos logins abren navegador y los tiene que hacer una persona. El resto es
copiar y pegar.

## 1 · Convex (primero, siempre)

```bash
npx convex dev
```

Login por navegador, elegís/creás el proyecto, y deja el proceso corriendo.
Escribe solo en `.env.local`:

```
CONVEX_DEPLOYMENT=dev:algo-animal-123
NEXT_PUBLIC_CONVEX_URL=https://algo-animal-123.convex.cloud
```

En **otra terminal**, los datos de la demo:

```bash
npx convex run seed:run
```

Verificás que quedó: entrá a `http://localhost:3000/developers/mariafernandez`.
Si ves los datos, ya no está leyendo mocks.

## 2 · Que Convex acepte la identidad de Clerk

En el dashboard de Clerk: **JWT Templates → New template → preset Convex**.
El nombre tiene que ser exactamente `convex`. Copiá el **Issuer** (la Frontend
API URL).

```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://<tu-issuer>
```

> Esta variable va en el **deployment de Convex**, no en `.env.local`. Puesta
> en el lugar equivocado no falla nada visible: simplemente todas las queries
> autenticadas devuelven `null` para siempre.

## 3 · Vercel

```bash
vercel login
vercel link          # crear el proyecto, aceptar los defaults de Next.js
```

Las tres variables de entorno (te pide el valor en cada una):

```bash
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
vercel env add CLERK_SECRET_KEY production
vercel env add NEXT_PUBLIC_CONVEX_URL production
```

Los valores de Clerk salen del dashboard de Clerk (API keys). El de Convex es
el `NEXT_PUBLIC_CONVEX_URL` que quedó en `.env.local` en el paso 1.

```bash
vercel --prod
```

Sale una URL `https://<proyecto>.vercel.app`. Esa es la que ve el jurado.

## 4 · Después de desplegar

- El comando de instalación del paso 2 del onboarding se arma solo con el
  dominio donde corre la app: en Vercel va a apuntar a la URL de Vercel, sin
  tocar código.
- Las claves de Clerk son de **development**. Funcionan en un dominio de
  Vercel, con límites más bajos y un aviso de modo desarrollo. Para producción
  de verdad hace falta una instancia de producción en Clerk y un dominio
  propio — no es para hoy.

## Si algo falla

| Síntoma | Causa casi segura |
|---|---|
| El panel muestra a María y Luis pero nada de lo que hacés se guarda | Falta `npx convex run seed:run`, o estás en modo mocks: no hay `NEXT_PUBLIC_CONVEX_URL` |
| Estás logueado pero `users.me` devuelve `null` | Falta el JWT template `convex`, o `CLERK_JWT_ISSUER_DOMAIN` quedó en `.env.local` en vez del deployment |
| El build de Vercel pasa pero la app tira error de Convex | Falta `NEXT_PUBLIC_CONVEX_URL` en las variables de Vercel |
