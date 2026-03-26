import { requireRole } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { AssetRequestForm } from '@/components/forms/asset-request-form';

export default async function NewAssetPage() {
  await requireRole([UserRole.ISSUER, UserRole.ADMIN]);
  return <AssetRequestForm />;
}
