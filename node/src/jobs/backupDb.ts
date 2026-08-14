import process from 'node:process';
import { drive_v3, google } from 'googleapis';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import JobExecutionLogService from '../modules/core/services/JobExecutionLogService';

/**
 * Creates a PostgreSQL dump (pg_dump) and uploads it to a configured Google Drive folder.
 */
export async function backupDb(
    currentDate: Date

) {
    const jobName = 'backup-db';
    const logService = new JobExecutionLogService();

    await logService.logInfo(jobName, 'Starting backup process');


    /**
     * Vérifies qu'une variable d'environnement est définie et retourne sa valeur.
     * Throw si la variable n'est pas définie.
     * @param varName 
     * @returns 
     */
    function requireEnv(varName: string): string {
        const value = process.env[varName];

        if (!value) {
            throw new Error(`[${jobName}] - Missing environment variable: ${varName}`);
        }
        return value;
    }

    const google_client_id = requireEnv('GOOGLE_CLIENT_ID');
    const google_client_secret = requireEnv('GOOGLE_CLIENT_SECRET');
    const google_refresh_token = requireEnv('GOOGLE_REFRESH_TOKEN');
    const google_backup_folder_id = requireEnv('GOOGLE_BACKUP_FOLDER_ID');

    const oauth2Client = new google.auth.OAuth2(
        google_client_id,
        google_client_secret
    );

    oauth2Client.setCredentials({ refresh_token: google_refresh_token });

    await logService.logInfo(jobName, 'Google OAuth2 client configured successfully: ' + google_client_id);

    // Assures qu'il existe pg_dump dans le PATH.
    const execFileAsync = promisify(execFile);

    await execFileAsync("which", ["pg_dump"]).catch(async () => {
        await logService.logError(jobName, "pg_dump command not found. Please ensure PostgreSQL is installed and pg_dump is in your PATH.");
        throw new Error("pg_dump command not found. Please ensure PostgreSQL is installed and pg_dump is in your PATH.");
    });

    const db_user = requireEnv('DB_USER');
    const db_pass = requireEnv('DB_PASS');
    const db_host = requireEnv('DB_HOST');
    const db_port = requireEnv('DB_PORT');
    const db_name = requireEnv('DB_NAME');
    const db_schema = requireEnv('DB_SCHEMA');

    // ---------------------------------------------------------------------
    // Temporary backup directory
    // ---------------------------------------------------------------------
    const dateName = currentDate
        .toISOString()
        .replace(/[:.]/g, '-');

    const tempDir = await fs.promises.mkdtemp(
        path.join(os.tmpdir(), `backup-${dateName}-`)
    );
    const dumpPath = path.join(tempDir, 'backup.sql');

    const pgDumpDatabaseUrl =
        `postgresql://${db_user}:${db_pass}` +
        `@${db_host}:${db_port}` +
        `/${db_name}`;

    // -----------------------------------------------------------------
    // PostgreSQL dump
    // -----------------------------------------------------------------
    try {

        //Lance une commande pg_dump pour créer un dump de la base de données PostgreSQL
        await execFileAsync('pg_dump', [
            '--dbname',
            pgDumpDatabaseUrl,
            '--format=plain',
            '--schema',
            db_schema,
            '--file',
            dumpPath,
        ]);

        const dumpStats = await fs.promises.stat(dumpPath);

        await logService.logInfo(
            jobName,
            `PostgreSQL dump created successfully (${dumpStats.size} bytes)`
        );

        // Connect to Drive.
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        const monthFolderId = await getOrCreateMonthFolder(
            drive,
            google_backup_folder_id,
            currentDate,
        );

        const response = await drive.files.create({
            requestBody: {
                name: `backup-${dateName}.sql`,
                mimeType: 'application/sql',
                parents: [monthFolderId], // Id du dossier "Backup chocosous/YYYY-MM"
            },
            media: {
                mimeType: 'application/sql',
                body: fs.createReadStream(dumpPath),
            },
        });

        await logService.logSuccess(
            jobName,
            `Successfully created backup file: ${response.data.name} (${response.data.id})`,
            { date: currentDate }
        );
    } catch (error) {
        await logService.logError(
            jobName,
            `Error during backup process`,
            error
        );
        throw error;
    } finally {
        // -----------------------------------------------------------------
        // Cleanup
        // -----------------------------------------------------------------
        try {
            await fs.promises.rm(tempDir, {
                recursive: true,
                force: true,
            });
            await logService.logInfo(
                jobName,
                `Temporary directory removed: ${tempDir}`,
                { date: currentDate }
            );
        } catch (cleanupError) {
            await logService.logError(
                jobName,
                `Failed to remove temporary directory: ${tempDir}`,
                cleanupError
            );
        }
    }
}

async function getOrCreateMonthFolder(
    drive:drive_v3.Drive,
    parentFolderId: string,
    date: Date,
): Promise<string> {
    const name = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

    const { data } = await drive.files.list({
        q: `'${parentFolderId}' in parents and name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id)',
        pageSize: 1,
    });

    if (data.files?.[0]?.id) return data.files[0].id;

    const { data: folder } = await drive.files.create({
        requestBody: {
            name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentFolderId],
        },
        fields: 'id',
    });

    return folder.id!;
}