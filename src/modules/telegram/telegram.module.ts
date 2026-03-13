import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { session, Scenes } from 'telegraf';
import { TelegramService } from './telegram.service';
import { TelegramUpdate } from './telegram.update';
import { OnboardingScene } from './scenes/onboarding.scene';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule,
    UsersModule,

    TelegrafModule.forRootAsync({
      imports:    [ConfigModule],
      inject:     [ConfigService],
      useFactory: (config: ConfigService) => ({
        token: config.getOrThrow<string>('telegram.botToken'),
        middlewares: [
          // 1. Persist session across messages (required for WizardScene state)
          session(),
          // 2. Register scenes — NestJS telegraf integration wires providers automatically
          new Scenes.Stage([
            // Scene class references are registered via the providers array below;
            // nestjs-telegraf picks them up through the @Wizard() decorator.
          ]).middleware(),
        ],
      }),
    }),
  ],
  providers: [
    TelegramService,
    TelegramUpdate,
    OnboardingScene,
  ],
  exports: [TelegramService],
})
export class TelegramModule {}
