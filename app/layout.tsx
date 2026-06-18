import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import PwaInstallManager from "./components/pwa-install-manager";

// Fraunces: serif con carácter para títulos y el monograma de marca.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

// Manrope: sans limpia y legible para el cuerpo y los formularios.
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "K's Shop",
  description:
    "K's Shop — tus compras de AliExpress, Shein, Temu y eBay, sin complicaciones.",
  // Habilita modo standalone y la barra de estado en iOS al instalar la PWA.
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "K's Shop",
  },
  // Ícono para "Agregar a inicio" en iOS.
  icons: {
    apple: "/icons/icono-192.png",
  },
};

// theme-color del navegador (barra superior en móvil), con la marca fucsia.
export const viewport: Viewport = {
  themeColor: "#ec0b86",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${fraunces.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/*
          Cierre de sesión al cerrar la pestaña: sessionStorage se borra cuando
          se cierra la pestaña. Si al entrar no existe la marca (pestaña nueva)
          pero quedan cookies de sesión de Supabase (sb-*), se borran y se vuelve
          al inicio, para que nunca entre solo a una cuenta. Corre antes de pintar.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var K='ks_sesion_activa';if(sessionStorage.getItem(K))return;sessionStorage.setItem(K,'1');var tiene=document.cookie.split('; ').some(function(c){return c.indexOf('sb-')===0});if(!tiene)return;document.cookie.split('; ').forEach(function(c){var n=c.split('=')[0];if(n.indexOf('sb-')===0){document.cookie=n+'=; path=/; max-age=0';}});location.replace('/');}catch(e){}})();`,
          }}
        />
        {children}
        {/* Invitación a instalar la PWA: prompt nativo en Android, guía en iOS. */}
        <PwaInstallManager />
      </body>
    </html>
  );
}
