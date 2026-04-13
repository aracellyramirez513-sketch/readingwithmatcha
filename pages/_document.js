import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="UTF-8" />
        <meta name="description" content="Honest book reviews on romance, dark romance, romantasy and more. Always with a matcha nearby." />
        <meta property="og:site_name" content="Reading with Matcha" />
        <meta name="theme-color" content="#faf8f4" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
