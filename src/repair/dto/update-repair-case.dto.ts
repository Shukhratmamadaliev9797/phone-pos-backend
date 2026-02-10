import { PartialType } from '@nestjs/swagger';
import { CreateRepairCaseDto } from './create-repair-case.dto';

export class UpdateRepairCaseDto extends PartialType(CreateRepairCaseDto) {}
