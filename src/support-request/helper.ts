import { SupportRequestViewDto } from './dto/support-request-view.dto';
import { SupportRequest } from './entities/support-request.entity';

export function toSupportRequestView(
  supportRequest: SupportRequest,
): SupportRequestViewDto {
  return {
    id: supportRequest.id,
    senderUserId: supportRequest.senderUserId,
    senderFullName: supportRequest.senderFullName,
    senderRole: supportRequest.senderRole,
    message: supportRequest.message,
    createdAt: supportRequest.createdAt,
    isRead: supportRequest.isRead,
    readAt: supportRequest.readAt,
    readByAdminId: supportRequest.readByAdminId,
  };
}
