import { debug as d } from "debug";
import { readFileSync } from "fs";
import glob from "glob";
import Handlebars from "handlebars";
import juice from "juice";
import { join } from "path";
import { EmailEmailAWSProvider } from "./providers/aws";
import { Provider } from "./providers/provider";
import { EmailInstance, EmailOpts } from "./types";

export * from "./types";

const debug = d("emailemail:EmailEmail");

const DEFAULT_TEMPLATE_DIRECTORY = join(__dirname, "..", "templates");

export type EmailProvider = "aws";

export type EmailEmailOpts = {
  provider_name: EmailProvider;
  provider_opts?: any;
  template_directory?: string;
  sender_email_address: string;
  reply_to_address: string;
};

const defaults: EmailEmailOpts = {
  provider_name: "aws",
  provider_opts: {},
  template_directory: DEFAULT_TEMPLATE_DIRECTORY,
  sender_email_address: process.env.SENDER_EMAIL_ADDRESS ?? "no-reply@ari.io",
  reply_to_address:
    process.env.REPLY_TO_ADDRESS ??
    process.env.SENDER_EMAIL_ADDRESS ??
    "unknown@ari.io",
};

export class EmailEmail {
  opts: EmailEmailOpts;
  provider: Provider;
  compiled_templates: any = {};

  constructor(opts: EmailEmailOpts) {
    this.opts = opts = { ...defaults, ...opts };

    switch (this.opts.provider_name) {
      case "aws":
      default:
        debug(`Using aws as email provider`);
        this.provider = new EmailEmailAWSProvider(this.opts.provider_opts);
        break;
    }
  }

  async sendEmail(
    emailOpts: EmailInstance,
    template_name?: string,
    rawContext: any = {},
    html_template_content?: string,
    text_template_content?: string
  ): Promise<boolean> {
    const context = { email: emailOpts, ...rawContext };
    const { toAddresses, subject, ccAddresses, bccAddresses } = emailOpts;
    const compiled_html_template = await this.compile_html_template(
      template_name,
      html_template_content,
      context
    );
    const compiled_text_template = await this.compile_template(
      template_name,
      "txt",
      text_template_content,
      context
    );

    const compiledSubject = Handlebars.compile(subject)(context);

    const options: EmailOpts = {
      compiled_html_template,
      compiled_text_template,
      subject: compiledSubject,
      destination: {
        toAddresses: Array.isArray(toAddresses) ? toAddresses : [toAddresses],
        ccAddresses: ccAddresses ?? null,
        bccAddresses: bccAddresses ?? null,
      },
      replyToAddress: this.opts.reply_to_address,
      senderAddress: this.opts.sender_email_address,
    };

    debug(`Sending email: `, options);
    return this.provider.sendEmail(options);
  }

  async compile_template(
    name?: string,
    type: "html" | "txt" = "html",
    content?: string,
    context: any = {}
  ): Promise<string> {
    const template_name = `${name}.${type}`;
    if (!this.compiled_templates[template_name]) {
      if (content) {
        debug(`Template content passed in: ${content}`);
        const template = Handlebars.compile(content);
        this.compiled_templates[template_name] = template;
      } else {
        debug(`Looking for template: ${template_name}`);
        const files = this.opts.template_directory
          ? glob.sync(
              join(this.opts.template_directory, "**/*.{hbs,html,txt}"),
              { ignore: ["**/*.css"] }
            )
          : [];

        const templateFile = files.find(
          (filename: string) => filename.indexOf(template_name) >= 0
        );

        if (templateFile) {
          const template = readFileSync(templateFile, "utf-8");
          this.compiled_templates[template_name] = Handlebars.compile(template);
        } else {
          return "";
        }
      }
    }

    const template = this.compiled_templates[template_name];
    return template ? template(context) : "";
  }

  async compile_html_template(
    name?: string,
    content?: string,
    context: any = {}
  ): Promise<string> {
    // return new Promise(async (resolve, reject) => {
    const template = await this.compile_template(
      name,
      "html",
      content,
      context
    );
    if (!template) {
      throw new Error(`Template could not be created`);
    }
    return new Promise((resolve, reject) => {
      juice.juiceResources(
        template,
        {
          webResources: {
            relativeTo: this.opts.template_directory ?? process.cwd(),
          },
        },
        (err, html) => {
          if (err) {
            reject(err);
          }
          resolve(html);
        }
      );
    });
  }
}
