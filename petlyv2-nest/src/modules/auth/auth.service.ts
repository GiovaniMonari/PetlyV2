import { Injectable, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset.password.dto';
import { EmailService } from '../email-send/email-send.service';
import { ForgetPasswordDto } from './dto/forget.password.dto';
import { ForgotPasswordResponseDto } from './dto/reset.message.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,

    @InjectRedis() private readonly redis: Redis,
  ) {}

  /**
   * Registra um novo usuário (tutor ou cuidador)
   */
  async register(createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);

    const payload = {
      sub: user._id,
      email: user.email,
      role: user.role,
    };

    return {
      message: 'Conta criada com sucesso',
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Login com email e senha
   */
  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = {
      sub: user._id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async forgetPassword(
    email: string,
  ): Promise<ForgotPasswordResponseDto> {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.usersService.findByEmail(normalizedEmail);

    if (user) {
      // Rate limit: máximo 5 solicitações por hora
      const rateLimitKey = `password-reset-limit:${user.email}`;

      const attempts = await this.redis.incr(rateLimitKey);

      if (attempts === 1) {
        await this.redis.expire(rateLimitKey, 3600);
      }

      if (attempts > 5) {
        throw new HttpException(
          'Muitas solicitações. Tente novamente mais tarde.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Cooldown: 1 e-mail por minuto
      const cooldownKey = `password-reset-cooldown:${user._id}`;

      const cooldown = await this.redis.get(cooldownKey);

      if (cooldown) {
        throw new HttpException(
          'Aguarde alguns instantes antes de solicitar outro e-mail.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      const resetToken = this.jwtService.sign(
        {
          sub: user._id,
          email: user.email,
          purpose: 'password_reset',
        },
        {
          expiresIn: '30m',
        },
      );

      await this.redis.set(
        `password-reset:${user._id}`,
        resetToken,
        'EX',
        1800,
      );

      // ativa cooldown
      await this.redis.set(
        cooldownKey,
        '1',
        'EX',
        60,
      );

      await this.emailService.sendResetPasswordEmailJob({
        email: user.email,
        userId: user._id as Types.ObjectId,
        userName: user.name,
        token: resetToken,
      });
    }

    return {
      message:
        'Se o e-mail informado estiver cadastrado, enviaremos as instruções de recuperação em instantes.',
    };
  }

  async validateResetToken(token: string) {
    const payload = this.jwtService.verify(token);

    const storedToken = await this.redis.get(
      `password-reset:${payload.sub}`,
    );

    if (!storedToken) {
      throw new UnauthorizedException(
        'Token expirado ou inválido',
      );
    }

    if (storedToken !== token) {
      throw new UnauthorizedException(
        'Existe um token mais recente para este usuário',
      );
    }

    return payload;
  }

  async resetPassword(
    token: string,
    password: string,
  ) {
    const payload = this.jwtService.verify(token);

    const storedToken = await this.redis.get(
      `password-reset:${payload.sub}`,
    );

    if (!storedToken || storedToken !== token) {
      throw new UnauthorizedException(
        'Token inválido ou expirado',
      );
    }

    await this.usersService.updatePassword(
      payload.sub,
      password,
    );

    await this.redis.del(
      `password-reset:${payload.sub}`,
    );

    return {
      message: 'Senha alterada com sucesso',
    };
  }
}
