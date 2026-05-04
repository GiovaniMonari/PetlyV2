import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /api/users/caregivers
   * Public - Lista cuidadores com filtros (usado pela página /cuidadores)
   */
  @Get('caregivers')
  findCaregivers(
    @Query('type') type?: string,
    @Query('location') location?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.usersService.findCaregivers({
      type,
      location,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sortBy,
    });
  }

  /**
   * GET /api/users/me
   * Protected - Retorna o perfil do usuário autenticado
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req: any) {
    return this.usersService.findById(req.user.userId);
  }

  /**
   * GET /api/users/:id
   * Public - Retorna um usuário pelo ID (sem dados sensíveis)
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  /**
   * PATCH /api/users/:id
   * Protected - Atualiza perfil do usuário
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  /**
   * DELETE /api/users/:id
   * Protected - Remove o usuário
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
    return this.usersService.uploadAvatar(req.user.userId, file);
  }

  /**
   * GET /api/users/me/favorites
   * Protected - Retorna a lista de cuidadores favoritados pelo tutor
   */
  @UseGuards(JwtAuthGuard)
  @Get('me/favorites')
  getFavoriteCaregivers(@Request() req: any) {
    return this.usersService.getFavoriteCaregivers(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/favorites')
  addFavoriteCaregiver(
    @Param('id') tutorId: string,
    @Body() { caregiverId }: { caregiverId: string },
    @Request() req: any,
  ) {
    return this.usersService.addFavoriteCaregiver(
      req.user.userId,
      caregiverId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/favorites/:caregiverId')
  removeFavoriteCaregiver(
    @Param('id') tutorId: string,
    @Param('caregiverId') caregiverId: string,
    @Request() req: any,
  ) {
    return this.usersService.removeFavoriteCaregiver(
      req.user.userId,
      caregiverId,
    );
  }
}
