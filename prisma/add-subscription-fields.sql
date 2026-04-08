-- Add subscription fields to User table
ALTER TABLE "User" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "User" ADD COLUMN "subscriptionStatus" TEXT NOT NULL DEFAULT 'free';
ALTER TABLE "User" ADD COLUMN "subscriptionPlan" TEXT NOT NULL DEFAULT 'free';
ALTER TABLE "User" ADD COLUMN "trialEnd" TIMESTAMP;
ALTER TABLE "User" ADD COLUMN "currentPeriodEnd" TIMESTAMP;

-- Add index for faster subscription status queries
CREATE INDEX "idx_User_subscriptionStatus" ON "User"("subscriptionStatus");
CREATE INDEX "idx_User_stripeCustomerId" ON "User"("stripeCustomerId");
