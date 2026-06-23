import { DynamicModule, Module } from '@nestjs/common';
import {
  I18nModule,
  AcceptLanguageResolver,
  HeaderResolver,
  I18nJsonLoader,
} from 'nestjs-i18n';
import * as path from 'path';

export interface AppI18nModuleOptions {
  appI18nPath: string;
  typesOutputPath: string;
}

@Module({})
export class AppI18nModule {
  static forRoot(options: AppI18nModuleOptions): DynamicModule {
    const sharedI18nPath = path.join(__dirname, 'shared-i18n');

    const loaders = [new I18nJsonLoader({ path: sharedI18nPath, watch: true })];

    if (options?.appI18nPath) {
      loaders.push(
        new I18nJsonLoader({ path: options.appI18nPath, watch: true }),
      );
    }

    return {
      module: AppI18nModule,
      imports: [
        I18nModule.forRoot({
          fallbackLanguage: 'en',
          loaders,
          typesOutputPath: options?.typesOutputPath,
          resolvers: [
            { use: HeaderResolver, options: ['x-custom-lang'] },
            AcceptLanguageResolver,
          ],
        }),
      ],
      exports: [I18nModule],
    };
  }
}
