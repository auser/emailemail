import { EmailEmailOpts } from "../src/emailemail";
import { EmailEmail } from "../src/index";

// jest.mock("../src/providers/aws");
jest.mock("aws-sdk");

const defaultEmailOptions: EmailEmailOpts = {
  provider_name: "aws",
  reply_to_address: "nobody@company.com",
  sender_email_address: "team@company.com",
};

describe("index", () => {
  let sendEmail: jest.Func;
  beforeEach(() => {
    sendEmail = jest.fn((args: any, cb) => cb(null, args));
    const AWS = require("aws-sdk");
    AWS.SES.mockImplementation(() => {
      return {
        sendEmail,
      };
    });
  });

  afterEach(() => jest.clearAllMocks());

  it("can be created", async () => {
    expect(() => new EmailEmail(defaultEmailOptions)).not.toThrow();
  });
  it("it generates a template content for default email template in local directory (welcome)", async () => {
    const e = new EmailEmail(defaultEmailOptions);

    await e.sendEmail(
      {
        name: "bob",
        subject: "Welcome",
        toAddresses: "bob@company.com",
        ccAddresses: null,
        bccAddresses: null,
      },
      `welcome`,
      { name: "bob" }
    );

    expect(sendEmail).toBeCalledWith(
      expect.objectContaining({
        Message: expect.objectContaining({
          Body: expect.objectContaining({
            Text: { Charset: "utf-8", Data: "Welcome bob" },
          }),
        }),
      }),
      expect.any(Function)
    );
  });

  it("it generates a html template content when passed in", async () => {
    const e = new EmailEmail(defaultEmailOptions);

    await e.sendEmail(
      {
        name: "bob",
        subject: "Welcome",
        toAddresses: "bob@company.com",
        ccAddresses: null,
        bccAddresses: null,
      },
      undefined,
      { name: "bob" },
      "<h1>Reset your password, {{email.name}}</h1>",
      "Reset your password, {{email.name}}"
    );

    expect(sendEmail).toBeCalledWith(
      expect.objectContaining({
        Message: expect.objectContaining({
          Body: expect.objectContaining({
            Html: {
              Charset: "utf-8",
              Data: "<h1>Reset your password, bob</h1>",
            },
          }),
        }),
      }),
      expect.any(Function)
    );
  });

  it("it generates a text template content when passed in", async () => {
    const e = new EmailEmail(defaultEmailOptions);

    await e.sendEmail(
      {
        name: "bob",
        subject: "Welcome",
        toAddresses: "bob@company.com",
        ccAddresses: null,
        bccAddresses: null,
      },
      undefined,
      { name: "bob" },
      "<h1>Reset your password, {{email.name}}</h1>",
      "Reset your password, {{email.name}}"
    );

    expect(sendEmail).toBeCalledWith(
      expect.objectContaining({
        Message: expect.objectContaining({
          Body: expect.objectContaining({
            Text: { Charset: "utf-8", Data: "Reset your password, bob" },
          }),
        }),
      }),
      expect.any(Function)
    );
  });

  it("it can use a multi-level context opbject a template content when passed in", async () => {
    const e = new EmailEmail(defaultEmailOptions);

    await e.sendEmail(
      {
        name: "bob",
        subject: "Welcome",
        toAddresses: "bob@company.com",
        ccAddresses: null,
        bccAddresses: null,
      },
      undefined,
      { name: "bob", authority: { level: 2 } },
      `<h1>Reset your password, {{email.name}}, You are a level: {{authority.level}}</h1>`,
      `Reset your password, {{email.name}}, You are a level: {{authority.level}}`
    );

    expect(sendEmail).toBeCalledWith(
      expect.objectContaining({
        Message: expect.objectContaining({
          Body: expect.objectContaining({
            Text: {
              Charset: "utf-8",
              Data: "Reset your password, bob, You are a level: 2",
            },
          }),
        }),
      }),
      expect.any(Function)
    );
  });

  it("it compile the subject line with template", async () => {
    const e = new EmailEmail(defaultEmailOptions);

    await e.sendEmail(
      {
        name: "bob",
        subject: "Welcome to the party {{ email.name }}",
        toAddresses: "bob@company.com",
        ccAddresses: null,
        bccAddresses: null,
      },
      undefined,
      { name: "bob", authority: { level: 2 } },
      `Reset your password, {{email.name}}, You are a level: {{authority.level}}`
    );

    expect(sendEmail).toBeCalledWith(
      expect.objectContaining({
        Message: expect.objectContaining({
          Subject: expect.objectContaining({
            Charset: "utf-8",
            Data: "Welcome to the party bob",
          }),
        }),
      }),
      expect.any(Function)
    );
  });
});
