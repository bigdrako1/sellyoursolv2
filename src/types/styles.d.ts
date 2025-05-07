
declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

declare namespace React {
  interface CSSProperties {
    '--solana'?: string;
    '--blue-purple-gradient'?: string;
    '--trading-highlight'?: string;
    '--trading-success'?: string;
    '--trading-darkAccent'?: string;
  }
}
