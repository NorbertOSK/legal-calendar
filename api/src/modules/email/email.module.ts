import { Global, Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import {
  assertEmailTemplatesReady,
  resolveEmailPartialsDir,
  resolveEmailTemplateDir,
} from './email.config';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const environment =
          configService.get<string>('environment') || process.env.NODE_ENV;
        const templateDir = resolveEmailTemplateDir(environment);
        const partialsDir = resolveEmailPartialsDir(environment);

        assertEmailTemplatesReady(templateDir, undefined, partialsDir);

        return {
          transport: {
            host: configService.get<string>('smtpHost'),
            port: configService.get<number>('smtpPort'),
            secure: false,
            auth: {
              user: configService.get<string>('smtpUser'),
              pass: configService.get<string>('smtpPass'),
            },
          },
          defaults: {
            from:
              configService.get<string>('smtpFrom') ||
              '"Legal Calendar" <noreply@legalcalendar.app>',
          },
          template: {
            dir: templateDir,
            adapter: new HandlebarsAdapter(undefined, {
              inlineCssEnabled: false,
            }),
            options: {
              strict: true,
            },
          },
          options: {
            partials: {
              dir: partialsDir,
              options: {
                strict: true,
              },
            },
          },
        };
      },
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
