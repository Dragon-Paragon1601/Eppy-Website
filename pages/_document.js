import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head />
      <body>
        <div id="__next">
          <Main />
          <NextScript />
        </div>
      </body>
    </Html>
  );
}