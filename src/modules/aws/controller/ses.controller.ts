import { Body, Controller, Post } from '@nestjs/common';
import { ses } from '../aws.config';
import { SendEmailCommand } from '@aws-sdk/client-ses';

@Controller('aws/ses')
export class SesController {
  @Post('send')
  async sendEmail(@Body() body: { to: string; subject: string; text: string }) {
    const data = await ses.send(
      new SendEmailCommand({
        Source: 'noreply@myapp.com',
        Destination: {
          ToAddresses: [body.to],
        },
        Message: {
          Subject: { Data: body.subject },
          Body: { Html: { Data: body.text } },
        },
      }),
    );

    return data;
  }
}
