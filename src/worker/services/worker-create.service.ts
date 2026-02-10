import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from 'src/user/user/entities/user.entity';
import { CreateWorkerDto } from '../dto/create-worker.dto';
import { WorkerViewDto } from '../dto/worker-result.dto';
import { Worker } from '../entities/worker.entity';
import { toWorkerView } from '../helper';
import { WorkerBaseService } from './worker-base.service';

@Injectable()
export class WorkerCreateService extends WorkerBaseService {
  async execute(dto: CreateWorkerDto): Promise<WorkerViewDto> {
    const created = await this.workersRepository.manager.transaction(
      async (manager) => {
        await this.ensureActiveWorkerPhoneUnique(dto.phoneNumber, undefined, manager);

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
              phoneNumber: dto.phoneNumber,
              address: dto.address ?? null,
            },
            manager,
          );
        }

        const worker = workerRepository.create({
          fullName: dto.fullName.trim(),
          phoneNumber: dto.phoneNumber.trim(),
          address: dto.address?.trim() ?? null,
          monthlySalary: this.toMoney(this.parseNumeric(dto.monthlySalary)),
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
