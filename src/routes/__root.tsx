import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { AIChat } from "@/components/dashboard/AIChat";
import { MissionProvider } from "@/lib/mission-context";
import { OpsProvider } from "@/lib/ops-context";
import { SafetyProvider } from "@/lib/safety-context";
import { Link } from "@tanstack/react-router";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
          COBA AI · Ошибка маршрута
        </div>
        <h1 className="mt-4 font-mono text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-2 text-xl font-semibold text-foreground">Страница не найдена</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Запрошенный маршрут не существует в системе управления.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Вернуться к телеметрии
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "COBA AI · Дашборд управления дронами" },
      {
        name: "description",
        content:
          "Полнофункциональная система управления ИИ-дронами COBA: телеметрия, миссии, флот и автономный ИИ-помощник.",
      },
      { name: "author", content: "COBA AI" },
      { property: "og:title", content: "COBA AI · Дашборд управления дронами" },
      {
        property: "og:description",
        content: "Реал-тайм телеметрия, управление миссиями, флотом и ИИ-помощник.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "COBA AI · Дашборд управления дронами" },
      { name: "description", content: "A Russian-language dashboard application for monitoring drone telemetry and mission data." },
      { property: "og:description", content: "A Russian-language dashboard application for monitoring drone telemetry and mission data." },
      { name: "twitter:description", content: "A Russian-language dashboard application for monitoring drone telemetry and mission data." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/5fe61ed8-fb7f-4c92-9e5b-233aa4a7a9b8/id-preview-17af7fdc--2cd8e1f3-acd4-439d-b4c4-59d0a515aca0.lovable.app-1776612402061.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/5fe61ed8-fb7f-4c92-9e5b-233aa4a7a9b8/id-preview-17af7fdc--2cd8e1f3-acd4-439d-b4c4-59d0a515aca0.lovable.app-1776612402061.png" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <MissionProvider>
      <OpsProvider>
        <SafetyProvider>
          <div className="flex h-screen w-full overflow-hidden bg-background">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <Header />
              <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
                <Outlet />
              </main>
              <MobileNav />
            </div>
            <AIChat />
          </div>
        </SafetyProvider>
      </OpsProvider>
    </MissionProvider>
  );
}
