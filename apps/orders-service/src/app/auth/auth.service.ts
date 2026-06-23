import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService, PrismaService } from '@libs/shared';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { I18nService } from 'nestjs-i18n';
import { I18nTranslations } from '../../i18n/i18n-types';

@Injectable()
export class AuthService {
  constructor(
    private readonly PrismaService: PrismaService,
    private readonly JwtService: JwtService,
    private readonly I18nService: I18nService<I18nTranslations>,
    private readonly AppConfigService: AppConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.PrismaService.customers.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException(
        this.I18nService.t('auth.user_already_exists'),
      );
    }

    const hashedPassword = await bcrypt.hash(
      registerDto.password,
      this.AppConfigService.bcrypt.saltRound,
    );

    const user = await this.PrismaService.customers.create({
      data: {
        first_name: registerDto.first_name,
        last_name: registerDto.last_name,
        email: registerDto.email,
        password: hashedPassword,
      },
    });

    // Remove password from returned object
    const { password, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.PrismaService.customers.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException(
        this.I18nService.t('auth.invalid_credentials'),
      );
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        this.I18nService.t('auth.invalid_credentials'),
      );
    }

    const payload = { sub: user.id, email: user.email };

    return {
      access_token: this.JwtService.sign(payload),
    };
  }
}
