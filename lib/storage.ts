import * as Minio from "minio";

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT || "9000"),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "",
  secretKey: process.env.MINIO_SECRET_KEY || "",
});

const bucketName = process.env.MINIO_BUCKET || "uploads";

// Initialize bucket and policy asynchronously if this is in a server environment
if (typeof window === "undefined") {
  ensureBucketExists().catch(console.error);
}

/**
 * Ensures the bucket exists, creates it if it doesn't.
 */
export async function ensureBucketExists() {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName, "us-east-1");

      // Set public policy for the bucket so images can be accessed publicly
      const policy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${bucketName}/*`],
          },
        ],
      };
      await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
      console.log(`MinIO Bucket "${bucketName}" and public policy ensured.`);
    }
  } catch (error) {
    console.error("Error ensuring MinIO bucket exists:", error);
  }
}

/**
 * Uploads a file to MinIO
 */
export async function uploadFile(fileName: string, fileBuffer: Buffer, contentType: string) {
  try {
    const objectName = `${Date.now()}-${fileName}`;
    await minioClient.putObject(bucketName, objectName, fileBuffer, fileBuffer.length, {
      "Content-Type": contentType,
    });

    // Return the public URL
    let publicUrl = process.env.MINIO_PUBLIC_URL;

    if (!publicUrl) {
      const protocol = process.env.MINIO_USE_SSL === "true" ? "https" : "http";
      publicUrl = `${protocol}://${process.env.MINIO_ENDPOINT}${process.env.MINIO_PORT ? `:${process.env.MINIO_PORT}` : ""}`;
    }

    return `${publicUrl.replace(/\/+$/, "")}/${bucketName}/${objectName}`;
  } catch (error) {
    console.error("MinIO Upload Error:", error);
    throw new Error("Failed to upload file to storage");
  }
}

/**
 * Deletes a file from MinIO
 */
export async function deleteFile(objectName: string) {
  try {
    await minioClient.removeObject(bucketName, objectName);
  } catch (error) {
    console.error("MinIO Delete Error:", error);
  }
}

export default minioClient;
