-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "googleSubjectId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "totalQuantity" INTEGER NOT NULL DEFAULT 0,
    "availableQuantity" INTEGER NOT NULL DEFAULT 0,
    "inUseQuantity" INTEGER NOT NULL DEFAULT 0,
    "unavailableQuantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME,
    "status" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "events_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "borrow_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipmentId" TEXT NOT NULL,
    "eventId" TEXT,
    "borrowedBy" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "purposeType" TEXT NOT NULL,
    "purposeNote" TEXT,
    "status" TEXT NOT NULL,
    "borrowedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "borrow_records_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "borrow_records_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "borrow_records_borrowedBy_fkey" FOREIGN KEY ("borrowedBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "return_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "borrowRecordId" TEXT NOT NULL,
    "returnedBy" TEXT NOT NULL,
    "returnedQuantity" INTEGER NOT NULL,
    "unavailableQuantity" INTEGER NOT NULL DEFAULT 0,
    "unavailableReason" TEXT,
    "note" TEXT,
    "returnedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "return_records_borrowRecordId_fkey" FOREIGN KEY ("borrowRecordId") REFERENCES "borrow_records" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "return_records_returnedBy_fkey" FOREIGN KEY ("returnedBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "inventory_adjustments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "equipmentId" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "adjustmentType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_adjustments_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "inventory_adjustments_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_googleSubjectId_key" ON "users"("googleSubjectId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
