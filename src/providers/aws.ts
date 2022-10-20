import AWS from "aws-sdk";
import { debug as d } from "debug";
import { defaultCharset, EmailOpts } from "../types";
import { Provider } from "./provider";

const debug = d(`emailemail:provider:aws`);

export type EmailEmailAWSOpts = {
  region?: string;
  profile?: string;
};

const defaults: EmailEmailAWSOpts = {
  region: "us-east-1",
};

export class EmailEmailAWSProvider implements Provider {
  opts: EmailEmailAWSOpts;
  region: string;
  ses: AWS.SES;

  constructor(opts: EmailEmailAWSOpts = {}) {
    this.opts = opts = { ...defaults, ...opts };
    this.region = this.opts.region ?? defaults.region ?? "us-east-1";
    this.ses = new AWS.SES();

    AWS.config.region = this.region;

    if (opts.profile) {
      const credentials = new AWS.SharedIniFileCredentials({
        profile: opts.profile,
      });
      AWS.config.credentials = credentials;
    }
  }

  async sendEmail(opts: EmailOpts): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const Message = {
        Body: {
          Html: {
            Data: opts.compiled_html_template,
            Charset: opts.htmlCharset ?? defaultCharset,
          },
          Text: {
            Data: opts.compiled_text_template,
            Charset: opts.textCharset ?? defaultCharset,
          },
        },
        Subject: {
          Data: opts.subject,
          Charset: opts.subjectCharset ?? defaultCharset,
        },
      };
      const Destination = {
        ToAddresses: opts.destination.toAddresses,
        CcAddresses: opts.destination.ccAddresses ?? [],
        BccAddresses: opts.destination.bccAddresses ?? [],
      };
      const params: AWS.SES.SendEmailRequest = {
        Destination,
        Message,
        Source: opts.senderAddress,
        ReplyToAddresses: [opts.replyToAddress],
      };

      try {
        debug(`Sending email through ses =>`, this.ses);
        this.ses.sendEmail(
          params,
          (err: AWS.AWSError, data: AWS.SES.SendEmailResponse) => {
            if (err) {
              debug(`Email send error: `, err);
              return reject(err);
            }
            debug(`Email send successfully: `, JSON.stringify(data, null, 2));
            resolve(true);
          }
        );
      } catch (err) {
        debug(`ERROR occurred when sending email`, err);
        debug(`Message details: ${JSON.stringify(params, null, 2)}`);
        throw err;
      }
    });
  }
}
