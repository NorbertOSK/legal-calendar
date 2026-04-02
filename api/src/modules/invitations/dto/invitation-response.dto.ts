export class InvitationResponseDto {
  id: string;
  email: string;
  invitedBy: {
    id: string;
    name: string;
    email: string;
  };
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
}
