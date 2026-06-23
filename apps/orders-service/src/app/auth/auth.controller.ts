import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { Response } from 'express';
import { I18nService } from 'nestjs-i18n';
import { I18nTranslations } from '../../i18n/i18n-types';
import { AppConfigService, SuccessResponseDto } from '@libs/shared';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly AuthService: AuthService,
    private readonly I18nService: I18nService<I18nTranslations>,
    private readonly AppConfigService: AppConfigService,
  ) {}

  @ApiOperation({
    summary: 'Register a new customer',
    description: 'Creates a new customer account with the provided details',
  })
  @ApiOkResponse({
    type: SuccessResponseDto,
  })
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.AuthService.register(registerDto);
  }

  @ApiOperation({
    summary: 'Login a customer',
    description: 'Logs in a customer with the provided details',
  })
  @ApiOkResponse({
    type: SuccessResponseDto,
  })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token } = await this.AuthService.login(loginDto);

    res.cookie(this.AppConfigService.jwt.cookieName, access_token, {
      httpOnly: true,
      secure: this.AppConfigService.app.isProduction,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    return {
      success: true,
      message: this.I18nService.t('auth.logged_in'),
    };
  }

  @ApiOperation({
    summary: 'Logout a customer',
    description: 'Logs out a customer',
  })
  @ApiOkResponse({
    type: SuccessResponseDto,
  })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(this.AppConfigService.jwt.cookieName);
    return {
      success: true,
      message: this.I18nService.t('auth.logged_out'),
    };
  }
}
