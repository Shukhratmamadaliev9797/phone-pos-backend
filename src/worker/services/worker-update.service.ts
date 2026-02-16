import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from 'src/user/user/entities/user.entity';
import { UpdateWorkerDto } from '../dto/update-worker.dto';
import { WorkerViewDto } from '../dto/worker-result.dto';
import { Worker, WorkerSalaryType } from '../entities/worker.entity';
import { toWorkerView } from '../helper';
import { WorkerBaseService } from './worker-base.service';
import { hashPassword } from 'src/auth/helper';

@Injectable()
export class WorkerUpdateService extends WorkerBaseService {
  async execute(id: number, dto: UpdateWorkerDto): Promise<WorkerViewDto> {
    const updated = await this.workersRepository.manager.transaction(
      async (manager) => {
        const worker = await this.getActiveWorkerOrThrow(id, manager);
        const workerRepository = manager.getRepository(Worker);
        const userRepository = manager.getRepository(User);

        const normalizedIncomingPhone =
          dto.phoneNumber !== undefined
            ? this.normalizeOptionalPhone(dto.phoneNumber)
            : undefined;

        if (
          normalizedIncomingPhone !== undefined &&
          normalizedIncomingPhone !== worker.phoneNumber
        ) {
          await this.ensureActiveWorkerPhoneUnique(
            normalizedIncomingPhone,
            worker.id,
            manager,
          );
        }

        if (dto.fullName !== undefined) {
          worker.fullName = dto.fullName.trim();
        }

        if (normalizedIncomingPhone !== undefined) {
          worker.phoneNumber = normalizedIncomingPhone;
        }

        if (dto.address !== undefined) {
          worker.address = dto.address?.trim() ?? null;
        }

        if (
          dto.salaryType !== undefined ||
          dto.monthlySalary !== undefined ||
          dto.salaryPercent !== undefined
        ) {
          const effectiveSalaryType = dto.salaryType ?? worker.salaryType;

          if (effectiveSalaryType === WorkerSalaryType.MONTHLY) {
            if (dto.monthlySalary === undefined && dto.salaryType === WorkerSalaryType.MONTHLY) {
              throw new BadRequestException(
                'monthlySalary is required when salaryType=MONTHLY',
              );
            }
            const monthly =
              dto.monthlySalary !== undefined
                ? this.parseNumeric(dto.monthlySalary)
                : this.parseNumeric(worker.monthlySalary);
            worker.salaryType = WorkerSalaryType.MONTHLY;
            worker.monthlySalary = this.toMoney(monthly);
            worker.salaryPercent = null;
          } else {
            if (dto.salaryPercent === undefined && dto.salaryType === WorkerSalaryType.PERCENT) {
              throw new BadRequestException(
                'salaryPercent is required when salaryType=PERCENT',
              );
            }
            const percent =
              dto.salaryPercent !== undefined
                ? this.parseNumeric(dto.salaryPercent)
                : this.parseNumeric(worker.salaryPercent ?? 0);
            worker.salaryType = WorkerSalaryType.PERCENT;
            worker.salaryPercent = this.toMoney(percent);
            worker.monthlySalary = this.toMoney(0);
          }
        }

        if (dto.workerRole !== undefined) {
          worker.workerRole = dto.workerRole;
        }

        if (dto.notes !== undefined) {
          worker.notes = dto.notes?.trim() ?? null;
        }

        const requestedAccess = dto.hasDashboardAccess ?? worker.hasDashboardAccess;

        if (!requestedAccess) {
          if (worker.userId) {
            await this.deactivateLinkedUser(worker.userId, manager);
            worker.user = null;
          }
          worker.hasDashboardAccess = false;

          return workerRepository.save(worker);
        }

        worker.hasDashboardAccess = true;

        if (!worker.userId) {
          if (!dto.login?.email || !dto.login?.password) {
            throw new BadRequestException(
              'login.email and login.password are required to enable dashboard access',
            );
          }

          const loginRole = this.mapWorkerRoleToUserRole(
            dto.workerRole ?? worker.workerRole,
            dto.login.role,
          );

          const newUser = await this.createLoginUser(
            {
              email: dto.login.email,
              password: dto.login.password,
              role: loginRole,
              fullName: worker.fullName,
              phoneNumber: worker.phoneNumber,
              address: worker.address,
            },
            manager,
          );

          worker.user = newUser;
          return workerRepository.save(worker);
        }

        const user = await userRepository.findOne({ where: { id: worker.userId } });
        if (!user) {
          throw new BadRequestException('Linked user not found');
        }

        user.isActive = true;
        user.deletedAt = null;

        if (dto.login?.email !== undefined) {
          await this.ensureActiveEmailUnique(dto.login.email, user.id, manager);
          user.email = dto.login.email;
        }

        if (dto.login?.password) {
          user.passwordHash = await hashPassword(dto.login.password);
          user.refreshTokenVersion += 1;
        }

        user.fullName = worker.fullName;
        user.phoneNumber = worker.phoneNumber;
        user.address = worker.address;
        user.role = this.mapWorkerRoleToUserRole(
          worker.workerRole,
          dto.login?.role,
        );

        await userRepository.save(user);

        worker.user = user;
        return workerRepository.save(worker);
      },
    );

    return toWorkerView(updated);
  }
}
