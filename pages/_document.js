import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          {/* 添加 favicon */}
          <link rel="icon" href="https://ik.imagekit.io/terryzhang/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202025-04-17%20204625.png" />
          <title>theme typace</title>
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
