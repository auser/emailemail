import { EmailOpts } from "../types";

export interface Provider {
  /**
   *
   * @param opts {EmailOpts}
   *  @param subject {string} - subject of the message
   *  @param destination {DestinationOpts}
   *    @param toAddresses {string[]} - the list of addresses to send the address
   *    @param ccAddresses {string[]} - ccAddresses
   *    @param bccAddresses {string[]} - bcc addresses
   *  @param replyToAddress {string[]} - addresses to reply to
   *  @param senderAddress {string} - address from the email
   *  @param compiled_html_template {string} - html template
   *  @param compiled_text_template {string} - text template
   * @returns boolean if sent
   */
  sendEmail(opts: EmailOpts): Promise<boolean>;
}
