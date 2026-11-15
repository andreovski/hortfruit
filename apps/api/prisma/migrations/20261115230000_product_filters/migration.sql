-- AlterTable
ALTER TABLE "products" ADD COLUMN     "wholesale" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "promotion" BOOLEAN NOT NULL DEFAULT false;
