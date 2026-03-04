/*
  Warnings:

  - You are about to drop the column `specialValue` on the `GameObject` table. All the data in the column will be lost.
  - Added the required column `employees` to the `GameObject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `marketCap` to the `GameObject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patents` to the `GameObject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `users` to the `GameObject` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GameObject" DROP COLUMN "specialValue",
ADD COLUMN     "employees" INTEGER NOT NULL,
ADD COLUMN     "marketCap" INTEGER NOT NULL,
ADD COLUMN     "patents" INTEGER NOT NULL,
ADD COLUMN     "users" INTEGER NOT NULL;
