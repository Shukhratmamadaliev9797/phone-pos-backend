import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from 'src/user/user/entities/user.entity';
import { CreateWorkerDto } from '../dto/create-worker.dto';
import { WorkerViewDto } from '../dto/worker-result.dto';
import { Worker, WorkerSalaryType } from '../entities/worker.entity';
import { toWorkerView } from '../helper';
import { WorkerBaseService } from './worker-base.service';

@Injectable()
export class WorkerCreateService extends WorkerBaseService {
  async execute(dto: CreateWorkerDto): Promise<WorkerViewDto> {
    if (dto.salaryType === WorkerSalaryType.MONTHLY) {
      if (dto.monthlySalary === undefined || Number(dto.monthlySalary) <= 0) {
        throw new BadRequestException(
          'monthlySalary is required and must be > 0 when salaryType=MONTHLY',
        );
      }
    } else if (dto.salaryType === WorkerSalaryType.PERCENT) {
      if (dto.salaryPercent === undefined || Number(dto.salaryPercent) <= 0) {
        throw new BadRequestException(
          'salaryPercent is required and must be > 0 when salaryType=PERCENT',
        );
      }
    }

    const created = await this.workersRepository.manager.transaction(
      async (manager) => {
        const normalizedPhone = this.normalizeOptionalPhone(dto.phoneNumber);
        await this.ensureActiveWorkerPhoneUnique(normalizedPhone, undefined, manager);

        const workerRepository = manager.getRepository(Worker);

        let linkedUser: User | null = null;
        const hasDashboardAccess = dto.hasDashboardAccess ?? false;

        if (hasDashboardAccess) {
          if (!dto.login?.email || !dto.login?.password) {
            throw new BadRequestException(
              'login.email and login.password are required when hasDashboardAccess=true',
            );
          }

          const loginRole = this.mapWorkerRoleToUserRole(
            dto.workerRole,
            dto.login.role,
          );

          linkedUser = await this.createLoginUser(
            {
              email: dto.login.email,
              password: dto.login.password,
              role: loginRole,
              fullName: dto.fullName,
              phoneNumber: normalizedPhone,
              address: dto.address ?? null,
            },
            manager,
          );
        }

        const worker = workerRepository.create({
          fullName: dto.fullName.trim(),
          phoneNumber: normalizedPhone,
          address: dto.address?.trim() ?? null,
          monthlySalary:
            dto.salaryType === WorkerSalaryType.MONTHLY
              ? this.toMoney(this.parseNumeric(dto.monthlySalary ?? 0))
              : this.toMoney(0),
          salaryType: dto.salaryType,
          salaryPercent:
            dto.salaryType === WorkerSalaryType.PERCENT
              ? this.toMoney(this.parseNumeric(dto.salaryPercent ?? 0))
              : null,
          workerRole: dto.workerRole,
          hasDashboardAccess,
          user: linkedUser,
          notes: dto.notes?.trim() ?? null,
        });

        return workerRepository.save(worker);
      },
    );

    return toWorkerView(created);
  }
}
