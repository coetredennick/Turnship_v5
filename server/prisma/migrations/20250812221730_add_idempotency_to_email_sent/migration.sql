-- Add idempotency key field to EmailSent
ALTER TABLE "EmailSent" ADD COLUMN "idempotencyKey" TEXT;

-- Create unique constraint for user + idempotency key  
CREATE UNIQUE INDEX "EmailSent_userId_idempotencyKey_key" ON "EmailSent"("userId", "idempotencyKey");