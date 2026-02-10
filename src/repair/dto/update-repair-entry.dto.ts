import { PartialType } from '@nestjs/swagger';
import { AddRepairEntryDto } from './add-repair-entry.dto';

export class UpdateRepairEntryDto extends PartialType(AddRepairEntryDto) {}
