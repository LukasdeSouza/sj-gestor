-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "email" VARCHAR(80) NOT NULL,
    "password" VARCHAR(80) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_id_UNIQUE" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_UNIQUE" ON "User"("email");
