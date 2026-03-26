CREATE TYPE "UserRole" AS ENUM ('INVESTOR', 'ISSUER', 'COLLABORATOR', 'ADMIN');
CREATE TYPE "AssetStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'FROZEN', 'REJECTED');
CREATE TYPE "OrderType" AS ENUM ('BUY', 'SELL');
CREATE TYPE "OrderStatus" AS ENUM ('EXECUTED', 'REJECTED', 'CANCELLED');
CREATE TYPE "CandleTimeframe" AS ENUM ('M1', 'M5', 'H1');
CREATE TYPE "ExchangeType" AS ENUM ('DEPOSIT', 'WITHDRAW');
CREATE TYPE "ExchangeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "username" TEXT NOT NULL UNIQUE,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'INVESTOR',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Session" (
  "id" TEXT PRIMARY KEY,
  "token" TEXT NOT NULL UNIQUE,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Wallet" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "balance" DECIMAL(18,4) NOT NULL DEFAULT 10000,
  "reservedBalance" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Asset" (
  "id" TEXT PRIMARY KEY,
  "ticker" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "issuerId" TEXT NOT NULL,
  "initialPrice" DECIMAL(18,4) NOT NULL,
  "currentPrice" DECIMAL(18,4) NOT NULL,
  "totalSupply" INTEGER NOT NULL,
  "circulatingSupply" INTEGER NOT NULL,
  "feePercent" DECIMAL(6,2) NOT NULL,
  "reservePercent" DECIMAL(6,2) NOT NULL,
  "reserveFundValue" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "fundPurpose" TEXT NOT NULL,
  "status" "AssetStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Asset_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "AssetApproval" (
  "id" TEXT PRIMARY KEY,
  "assetId" TEXT NOT NULL,
  "adminId" TEXT,
  "approved" BOOLEAN,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  CONSTRAINT "AssetApproval_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AssetApproval_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Holding" (
  "id" TEXT PRIMARY KEY,
  "walletId" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "averagePrice" DECIMAL(18,4) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE ("walletId", "assetId"),
  CONSTRAINT "Holding_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Holding_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Order" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "walletId" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "type" "OrderType" NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitPrice" DECIMAL(18,4) NOT NULL,
  "totalValue" DECIMAL(18,4) NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'EXECUTED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Order_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Order_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Trade" (
  "id" TEXT PRIMARY KEY,
  "assetId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "price" DECIMAL(18,4) NOT NULL,
  "value" DECIMAL(18,4) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Trade_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Trade_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Candle" (
  "id" TEXT PRIMARY KEY,
  "assetId" TEXT NOT NULL,
  "timeframe" "CandleTimeframe" NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL,
  "open" DECIMAL(18,4) NOT NULL,
  "high" DECIMAL(18,4) NOT NULL,
  "low" DECIMAL(18,4) NOT NULL,
  "close" DECIMAL(18,4) NOT NULL,
  "volume" DECIMAL(18,4) NOT NULL,
  UNIQUE ("assetId", "timeframe", "timestamp"),
  CONSTRAINT "Candle_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ExchangeOperation" (
  "id" TEXT PRIMARY KEY,
  "type" "ExchangeType" NOT NULL,
  "status" "ExchangeStatus" NOT NULL DEFAULT 'PENDING',
  "userId" TEXT NOT NULL,
  "walletId" TEXT NOT NULL,
  "collaboratorId" TEXT,
  "amountGameCurrency" DECIMAL(18,4) NOT NULL,
  "amountPlatformCurrency" DECIMAL(18,4) NOT NULL,
  "exchangeRate" DECIMAL(18,6) NOT NULL,
  "reservedAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "wasRefunded" BOOLEAN NOT NULL DEFAULT false,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "processedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExchangeOperation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ExchangeOperation_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ExchangeOperation_collaboratorId_fkey" FOREIGN KEY ("collaboratorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "AuditLog" (
  "id" TEXT PRIMARY KEY,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
