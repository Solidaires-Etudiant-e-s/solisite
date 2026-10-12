-- AlterTable
ALTER TABLE `articles` ADD COLUMN `syndicat_id` INTEGER NULL AFTER `updated_at`;

-- CreateIndex
CREATE INDEX `articles_syndicat_idx` ON `articles`(`syndicat_id`);

-- AddForeignKey
ALTER TABLE `articles` ADD CONSTRAINT `articles_syndicat_id_fkey` FOREIGN KEY (`syndicat_id`) REFERENCES `syndicats`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
