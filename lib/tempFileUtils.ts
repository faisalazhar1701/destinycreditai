import { unlink, readdir, stat } from 'fs/promises';
import path from 'path';

/**
 * Cleans up temporary files that are older than the specified age (in minutes)
 */
export async function cleanupTempFiles(maxAgeMinutes: number = 60) {
  try {
    const tempDir = path.join(process.cwd(), 'public', 'temp_uploads');
    const files = await readdir(tempDir);
    
    const now = Date.now();
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const fileStat = await stat(filePath);
      
      // Check if file is older than maxAgeMinutes
      if (now - fileStat.mtime.getTime() > maxAgeMinutes * 60 * 1000) {
        await unlink(filePath);
        console.log(`Cleaned up temporary file: ${file}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up temporary files:', error);
  }
}

/**
 * Deletes a specific temporary file
 */
export async function deleteTempFile(filePath: string) {
  try {
    const fullFilePath = path.join(process.cwd(), 'public', filePath);
    await unlink(fullFilePath);
  } catch (error) {
    console.error('Error deleting temporary file:', error);
  }
}