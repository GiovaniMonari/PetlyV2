import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { ForgetPasswordDto } from './dto/forget.password.dto';
import { ResetPasswordDto } from './dto/reset.password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/register
   * Registro de tutor ou cuidador
   */
  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  /**
   * POST /api/auth/login
   * Login com email e senha
   */
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('forget-password')
  forgetPassword(@Body() forgetPasswordDto: ForgetPasswordDto): Promise<ResetPasswordDto> {
    return this.authService.forgetPassword(forgetPasswordDto.email);
  }
}
