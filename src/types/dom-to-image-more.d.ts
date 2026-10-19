declare module 'dom-to-image-more' {
  interface Options {
    quality?: number;
    bgcolor?: string;
    width?: number;
    height?: number;
    style?: Record<string, string>;
    filter?: (node: HTMLElement) => boolean;
    cacheBust?: boolean;
    imagePlaceholder?: string;
    copyDefaultStyles?: boolean;
    skipFonts?: boolean;
    skipAutoScale?: boolean;
    preferredFontFormat?: string;
  }

  const domtoimage: {
    toBlob(node: Node, options?: Options): Promise<Blob>;
    toPng(node: Node, options?: Options): Promise<string>;
  };

  export default domtoimage;
}
