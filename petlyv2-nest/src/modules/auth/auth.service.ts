import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset.password.dto';
import { EmailSendService } from '../email-send/email-send.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailSendService: EmailSendService,
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

  async forgetPassword(email: string): Promise<ResetPasswordDto> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(normalizedEmail);

    if (user) {
      const resetToken = this.jwtService.sign(
        {
          sub: user._id,
          email: user.email,
          purpose: 'password_reset',
        },
        {
          expiresIn: process.env.RESET_PASSWORD_TOKEN_EXPIRATION || '30m',
        },
      );

      await this.emailSendService.sendResetPasswordEmail({
        email: user.email,
        userId: user._id as Types.ObjectId,
        userName: user.name,
        token: resetToken,
      });
    }

    return {
      message:
        'Se o e-mail informado estiver cadastrado, enviaremos as instrucoes de recuperacao em instantes.',
    };
  }
}
