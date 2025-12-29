/*
  Warnings:

  - You are about to drop the column `nome` on the `User` table. All the data in the column will be lost.
  - Added the required column `name` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "nome",
ADD COLUMN     "name" VARCHAR(100) NOT NULL;

-- CreateTable
CREATE TABLE "Client" (
    "id" UUID NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "phone" VARCHAR(11) NOT NULL,
    "email" VARCHAR(80),
    "user_id" UUID NOT NULL,
    "product_id" UUID,
    "due_date" INTEGER,
    "auto_billing" BOOLEAN NOT NULL,
    "additional_info" VARCHAR(552),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PixKey" (
    "id" UUID NOT NULL,
    "key_type" VARCHAR(256) NOT NULL,
    "key_value" VARCHAR(256) NOT NULL,
    "label" VARCHAR(256),
    "user_id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PixKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" UUID NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "description" VARCHAR(552),
    "user_id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppConnection" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "phone_number" TEXT NOT NULL,
    "is_connected" BOOLEAN NOT NULL DEFAULT false,
    "last_connected_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_id_UNIQUE" ON "Client"("id");

-- CreateIndex
CREATE UNIQUE INDEX "client_phone_UNIQUE" ON "Client"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "client_email_UNIQUE" ON "Client"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pix_key_id_UNIQUE" ON "PixKey"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PixKey_key_value_key" ON "PixKey"("key_value");

-- CreateIndex
CREATE UNIQUE INDEX "product_id_UNIQUE" ON "Product"("id");

-- CreateIndex
CREATE UNIQUE INDEX "template_id_UNIQUE" ON "Template"("id");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_connection_id_UNIQUE" ON "WhatsAppConnection"("id");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppConnection_user_id_key" ON "WhatsAppConnection"("user_id");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "PixKey" ADD CONSTRAINT "PixKey_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppConnection" ADD CONSTRAINT "WhatsAppConnection_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
