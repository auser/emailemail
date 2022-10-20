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

  it("it generates a template content when passed in", async () => {
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
});
