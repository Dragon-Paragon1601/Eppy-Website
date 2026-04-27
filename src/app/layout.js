import Providers from "./providers";
import ClientRoot from "./ClientRoot";
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="relative min-h-screen text-white overflow-x-hidden">
        <div className="app-background" aria-hidden="true" />
        <div className="app-overlay" aria-hidden="true" />
        <Providers>
          <ClientRoot>{children}</ClientRoot>
        </Providers>
      </body>
    </html>
  );
}
