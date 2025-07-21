import { 
  Controller, 
  Post, 
  Body, 
  BadRequestException,
  Get 
} from '@nestjs/common';
import { CreateDisbursementDto } from '../dto/create-disbursement.dto';
import { CreateDisbursementUseCase } from '../../application/use-cases/create-disbursement.use-case';

@Controller('disbursements')
export class DisbursementController {
  constructor(
    private readonly createDisbursementUseCase: CreateDisbursementUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateDisbursementDto) {
    const result = await this.createDisbursementUseCase.execute(dto);

    if (!result.success) {
      throw new BadRequestException(result.error);
    }

    return {
      id: result.value,
      status: 'PENDING',
      message: 'Desembolso creado exitosamente'
    };
  }

  @Get('health')
  health() {
    return { status: 'OK', message: 'Disbursement service is running' };
  }
}