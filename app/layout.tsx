import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";

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
    "K's Shop — tus compras de AliExpress, Shein y Alibaba, sin complicaciones.",
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
      </body>
    </html>
  );
}
