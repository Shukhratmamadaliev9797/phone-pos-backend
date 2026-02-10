import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from 'src/user/user/entities/user.entity';
import { UpdateWorkerDto } from '../dto/update-worker.dto';
import { WorkerViewDto } from '../dto/worker-result.dto';
import { Worker } from '../entities/worker.entity';
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

        if (dto.phoneNumber && dto.phoneNumber !== worker.phoneNumber) {
          await this.ensureActiveWorkerPhoneUnique(dto.phoneNumber, worker.id, manager);
        }

        if (dto.fullName !== undefined) {
          worker.fullName = dto.fullName.trim();
        }

        if (dto.phoneNumber !== undefined) {
          worker.phoneNumber = dto.phoneNumber.trim();
        }

        if (dto.address !== undefined) {
          worker.address = dto.address?.trim() ?? null;
        }

        if (dto.monthlySalary !== undefined) {
          worker.monthlySalary = this.toMoney(this.parseNumeric(dto.monthlySalary));
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
