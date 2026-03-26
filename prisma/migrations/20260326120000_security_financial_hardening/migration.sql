-- Auth hardening
ALTER TABLE "User"
  ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lockedUntil" TIMESTAMP(3);

-- Query performance indexes based on operational queries
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

CREATE INDEX "Asset_status_updatedAt_idx" ON "Asset"("status", "updatedAt");
CREATE INDEX "Asset_status_currentPrice_idx" ON "Asset"("status", "currentPrice");

CREATE INDEX "Trade_assetId_createdAt_idx" ON "Trade"("assetId", "createdAt" DESC);

CREATE INDEX "ExchangeOperation_userId_createdAt_idx" ON "ExchangeOperation"("userId", "createdAt" DESC);
CREATE INDEX "ExchangeOperation_status_expiresAt_idx" ON "ExchangeOperation"("status", "expiresAt");
CREATE INDEX "ExchangeOperation_status_createdAt_idx" ON "ExchangeOperation"("status", "createdAt" DESC);
CREATE INDEX "ExchangeOperation_walletId_status_idx" ON "ExchangeOperation"("walletId", "status");

CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt" DESC);
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt" DESC);
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt" DESC);
