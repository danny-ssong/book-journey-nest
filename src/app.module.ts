import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envVariableKeys } from './common/const/env.const';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProfilesModule } from './profiles/profiles.module';
import { PostModule } from './post/post.module';
import { AuthorsModule } from './authors/authors.module';
import { BooksModule } from './books/books.module';
import { AccessTokenAuthMiddleware } from './auth/middleware/access-token-auth.middleware';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/guard/auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.ENV === 'test' ? '.env.test' : '.env',
      validationSchema: Joi.object({
        ENV: Joi.string().valid('test', 'dev', 'prod').required(),
        DB_TYPE: Joi.string().valid('postgres').required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        HASH_ROUNDS: Joi.number().required(),
        ACCESS_TOKEN_SECRET: Joi.string().required(),
        REFRESH_TOKEN_SECRET: Joi.string().required(),
        KAKAO_BASE_URL: Joi.string().required(),
        KAKAO_API_KEY: Joi.string().required(),
        GOOGLE_CLIENT_ID: Joi.string().required(),
        GOOGLE_CLIENT_SECRET: Joi.string().required(),
        GOOGLE_CALLBACK_URL: Joi.string().required(),
        FRONTEND_URL: Joi.string().required(),
      }),
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: configService.get<string>(envVariableKeys.dbType) as 'postgres',
        host: configService.get<string>(envVariableKeys.dbHost),
        port: configService.get<number>(envVariableKeys.dbPort),
        username: configService.get<string>(envVariableKeys.dbUsername),
        password: configService.get<string>(envVariableKeys.dbPassword),
        database: configService.get<string>(envVariableKeys.dbDatabase),
        synchronize:
          configService.get<string>(envVariableKeys.env) === 'prod'
            ? false
            : true,
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        ssl:
          configService.get<string>(envVariableKeys.env) === 'prod'
            ? {
                rejectUnauthorized: false,
              }
            : undefined,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    ProfilesModule,
    PostModule,
    AuthorsModule,
    BooksModule,
  ],
  controllers: [],
  providers: [],
  // providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
// export class AppModule implements NestModule {
//   configure(consumer: MiddlewareConsumer) {
//     consumer
//       .apply(AccessTokenAuthMiddleware)
//       .exclude(
//         { path: 'auth/google', method: RequestMethod.GET },
//         { path: 'auth/google/callback', method: RequestMethod.GET },
//         { path: 'auth/access-token/refresh', method: RequestMethod.POST },
//         { path: 'books/search', method: RequestMethod.GET },
//         { path: 'books/:isbn', method: RequestMethod.GET },
//         { path: 'posts/book/:isbn', method: RequestMethod.GET },
//         { path: 'users/:userId', method: RequestMethod.GET },
//       )
//       .forRoutes('*');
//   }
// }
