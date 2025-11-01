// 外部モジュールの型定義

declare module '@microflash/remark-callout-directives' {
  interface CalloutConfig {
    title: string;
    hint: string;
  }

  interface CalloutDirectivesOptions {
    callouts?: Record<string, CalloutConfig>;
  }

  const remarkCalloutDirectives: any;
  export default remarkCalloutDirectives;
}
