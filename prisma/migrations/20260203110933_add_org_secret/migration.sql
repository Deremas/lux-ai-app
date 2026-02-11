-- CreateTable
CREATE TABLE "org_secret" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "meta_whatsapp_token_enc" TEXT,
    "meta_whatsapp_phone_id_enc" TEXT,
    "twilio_account_sid_enc" TEXT,
    "twilio_auth_token_enc" TEXT,
    "twilio_whatsapp_from_enc" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "org_secret_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "org_secret_org_id_unique" ON "org_secret"("org_id");

-- AddForeignKey
ALTER TABLE "org_secret" ADD CONSTRAINT "org_secret_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "org"("id") ON DELETE CASCADE ON UPDATE CASCADE;
