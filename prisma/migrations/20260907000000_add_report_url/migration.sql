-- AlterTable
ALTER TABLE `site_settings` ADD COLUMN `report_url` VARCHAR(512) NOT NULL DEFAULT '' AFTER `contact_phone`;

-- Update existing row with default value
UPDATE `site_settings` SET `report_url` = 'https://framaforms.org/formulaire-de-signalement-vssoppression-sesl-1788696868' WHERE `id` = 1;
