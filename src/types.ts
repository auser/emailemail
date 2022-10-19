export type EmailInstance = {
  name: string;
  subject: string;
  toAddresses: string[] | string;
  ccAddresses: string[] | null;
  bccAddresses: string[] | null;
};

export type ProviderOpts = {};

export type DestinationOpts = {
  toAddresses: string[];
  ccAddresses: string[] | null;
  bccAddresses: string[] | null;
};

export type EmailOpts = {
  compiled_html_template: string;
  compiled_text_template: string;
  subject: string;
  destination: DestinationOpts;
  replyToAddress: string;
  senderAddress: string;
  htmlCharset?: string;
  textCharset?: string;
  subjectCharset?: string;
};

export const defaultCharset = "utf-8";
