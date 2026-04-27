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
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-KN7E7ZYL2S" />
        <script dangerouslySetInnerHTML={{__html:`
          window.dataLayer=window.dataLayer||[];
          function gtag(){dataLayer.push(arguments);}
          gtag('js',new Date());
          gtag('config','G-KN7E7ZYL2S');
        `}}/>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
